/**
 * Server-side document text extraction using Google Cloud Vision OCR.
 *
 * PDF: Google Cloud Vision files:annotate (native PDF OCR)
 * DOCX/DOC: Converted to PDF via LibreOffice headless, then OCR'd
 * TXT: Simple text decode (no OCR needed)
 */

import { execFile } from "child_process";
import { writeFile, readFile, unlink, mkdtemp, rmdir } from "fs/promises";
import { createSign } from "crypto";
import { tmpdir } from "os";
import { join, resolve } from "path";

const CHUNK_SIZE = 2000; // Characters (~500 tokens)
const CHUNK_OVERLAP = 200;
const VISION_PAGES_PER_BATCH = 5; // Google Vision API limit

// --- Google Cloud Vision Auth ---

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

/**
 * Load service account credentials from:
 * 1. GOOGLE_APPLICATION_CREDENTIALS_JSON (inline JSON string)
 * 2. GOOGLE_APPLICATION_CREDENTIALS (path to JSON file)
 */
async function loadServiceAccountKey(): Promise<ServiceAccountKey> {
  const jsonStr = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (jsonStr) {
    return JSON.parse(jsonStr);
  }

  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyPath) {
    const resolved = resolve(keyPath);
    const content = await readFile(resolved, "utf-8");
    return JSON.parse(content);
  }

  throw new Error(
    "Set GOOGLE_APPLICATION_CREDENTIALS (path to JSON key file) or GOOGLE_APPLICATION_CREDENTIALS_JSON (inline JSON)",
  );
}

/**
 * Create a signed JWT and exchange it for an OAuth2 access token.
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt - 60000) {
    return cachedAccessToken.token;
  }

  const sa = await loadServiceAccountKey();
  const now = Math.floor(Date.now() / 1000);

  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");

  const payload = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/cloud-vision",
      aud: sa.token_uri || "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  ).toString("base64url");

  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(sa.private_key, "base64url");

  const jwt = `${header}.${payload}.${signature}`;

  const tokenResponse = await fetch(
    sa.token_uri || "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    },
  );

  if (!tokenResponse.ok) {
    const errText = await tokenResponse.text();
    throw new Error(
      `Failed to get access token: ${tokenResponse.status} ${errText}`,
    );
  }

  const tokenData = await tokenResponse.json();
  cachedAccessToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
  };
  return cachedAccessToken.token;
}

/**
 * Build the Vision API URL and auth headers.
 * Prefers service account credentials over simple API key.
 */
async function visionFetchParams(endpoint: string): Promise<{
  url: string;
  headers: Record<string, string>;
}> {
  // Prefer service account credentials (more secure, supports billing)
  if (
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  ) {
    const accessToken = await getAccessToken();
    return {
      url: `https://vision.googleapis.com/v1/${endpoint}`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }

  // Fall back to simple API key
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (apiKey) {
    return {
      url: `https://vision.googleapis.com/v1/${endpoint}?key=${apiKey}`,
      headers: { "Content-Type": "application/json" },
    };
  }

  throw new Error(
    "No Google Cloud Vision credentials configured. Set GOOGLE_APPLICATION_CREDENTIALS_JSON, GOOGLE_APPLICATION_CREDENTIALS, or GOOGLE_VISION_API_KEY.",
  );
}

// --- Google Cloud Vision OCR ---

/**
 * OCR a PDF buffer using Google Cloud Vision files:annotate.
 * Processes 5 pages per request (API limit), batching for longer documents.
 */
async function ocrPdf(buffer: Buffer): Promise<string> {
  const base64Content = buffer.toString("base64");

  const allText: string[] = [];
  let pageOffset = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    const pages = Array.from(
      { length: VISION_PAGES_PER_BATCH },
      (_, i) => pageOffset + i,
    );

    const { url, headers } = await visionFetchParams("files:annotate");

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        requests: [
          {
            inputConfig: {
              content: base64Content,
              mimeType: "application/pdf",
            },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            pages,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Google Cloud Vision API error: ${response.status} ${errorText}`,
      );
    }

    const data = await response.json();
    const pageResponses = data.responses?.[0]?.responses || [];

    for (const pageResp of pageResponses) {
      const text = pageResp.fullTextAnnotation?.text;
      if (text?.trim()) {
        allText.push(text.trim());
      }
    }

    if (pageResponses.length < VISION_PAGES_PER_BATCH) {
      hasMorePages = false;
    } else {
      pageOffset += VISION_PAGES_PER_BATCH;
    }
  }

  const result = allText.join("\n\n");
  if (!result.trim()) {
    throw new Error("Google Cloud Vision OCR returned no text from PDF");
  }
  return result;
}

// --- DOCX/DOC conversion via LibreOffice ---

/**
 * Convert a DOCX/DOC file to PDF using LibreOffice headless mode,
 * then OCR the resulting PDF with Google Cloud Vision.
 */
async function ocrWord(buffer: Buffer, extension: string): Promise<string> {
  const tempDir = await mkdtemp(join(tmpdir(), "ocr-"));
  const inputPath = join(tempDir, `input.${extension}`);
  const outputPath = join(tempDir, "input.pdf");

  try {
    await writeFile(inputPath, buffer);

    await new Promise<void>((resolve, reject) => {
      execFile(
        "soffice",
        ["--headless", "--convert-to", "pdf", "--outdir", tempDir, inputPath],
        { timeout: 60000 },
        (error) => {
          if (error) {
            reject(
              new Error(
                `LibreOffice conversion failed: ${error.message}. ` +
                  `Ensure LibreOffice is installed (apt install libreoffice-core) for DOCX/DOC support.`,
              ),
            );
          } else {
            resolve();
          }
        },
      );
    });

    const pdfBuffer = await readFile(outputPath);
    return ocrPdf(pdfBuffer);
  } finally {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
    await rmdir(tempDir).catch(() => {});
  }
}

// --- TXT extraction ---

function extractTextFromTxt(buffer: Buffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("latin1").decode(buffer);
  }
}

// --- Public API ---

export async function extractText(
  buffer: Buffer,
  fileType: string,
): Promise<string> {
  switch (fileType.toLowerCase()) {
    case "pdf":
      return ocrPdf(buffer);
    case "docx":
      return ocrWord(buffer, "docx");
    case "doc":
      return ocrWord(buffer, "doc");
    case "txt":
      return extractTextFromTxt(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

export function chunkText(text: string): string[] {
  if (!text || text.length <= CHUNK_SIZE) {
    return text ? [text.trim()] : [];
  }

  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    const paraLength = trimmedPara.length;

    // If single paragraph exceeds chunk size, split by sentences
    if (paraLength > CHUNK_SIZE) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join("\n\n"));
        currentChunk = [];
        currentLength = 0;
      }

      const sentences = trimmedPara.split(/(?<=[.!?])\s+/);
      let sentenceChunk = "";

      for (const sentence of sentences) {
        if (sentenceChunk.length + sentence.length > CHUNK_SIZE) {
          if (sentenceChunk) chunks.push(sentenceChunk.trim());
          sentenceChunk = sentence;
        } else {
          sentenceChunk += (sentenceChunk ? " " : "") + sentence;
        }
      }
      if (sentenceChunk) chunks.push(sentenceChunk.trim());
      continue;
    }

    // Check if adding this paragraph would exceed chunk size
    if (currentLength + paraLength + 2 > CHUNK_SIZE) {
      chunks.push(currentChunk.join("\n\n"));

      // Start new chunk with overlap
      if (CHUNK_OVERLAP > 0 && currentChunk.length > 0) {
        const overlapText = currentChunk.join("\n\n").slice(-CHUNK_OVERLAP);
        currentChunk = [overlapText, trimmedPara];
        currentLength = overlapText.length + paraLength + 2;
      } else {
        currentChunk = [trimmedPara];
        currentLength = paraLength;
      }
    } else {
      currentChunk.push(trimmedPara);
      currentLength += paraLength + 2;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join("\n\n"));
  }

  return chunks;
}
