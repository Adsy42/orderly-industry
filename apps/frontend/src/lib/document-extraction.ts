/**
 * Server-side document text extraction and chunking utilities.
 *
 * Supports PDF (via pdfjs-dist), DOCX (via jszip), and TXT files.
 * Used by /api/documents/process when no structure extraction agent is available.
 */

import JSZip from "jszip";

const CHUNK_SIZE = 2000; // Characters (~500 tokens)
const CHUNK_OVERLAP = 200;

// --- PDF extraction via pdfjs-dist ---

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item) => "str" in item)
      .map((item) => (item as { str: string }).str)
      .join(" ");
    if (pageText.trim()) {
      pages.push(pageText.trim());
    }
  }

  const result = pages.join("\n\n");
  if (!result.trim()) {
    return "[PDF requires OCR for text extraction - no native text found]";
  }
  return result;
}

// --- DOCX extraction via jszip (ported from edge function) ---

function extractTextFromXml(xml: string): string {
  const parts: string[] = [];

  const paragraphRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g;
  let paragraphMatch;

  while ((paragraphMatch = paragraphRegex.exec(xml)) !== null) {
    const paragraphContent = paragraphMatch[1];

    const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let textMatch;
    const texts: string[] = [];

    while ((textMatch = textRegex.exec(paragraphContent)) !== null) {
      texts.push(textMatch[1]);
    }

    const paragraphText = texts.join("");
    if (paragraphText.trim()) {
      parts.push(paragraphText);
    }
  }

  let result = parts.join("\n\n");

  // Decode XML entities
  result = result
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
      String.fromCharCode(parseInt(code, 16)),
    );

  // Clean up excessive whitespace
  result = result
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  return result.trim();
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const parts: string[] = [];

    // Extract main document content
    const documentXml = zip.file("word/document.xml");
    if (documentXml) {
      const xmlContent = await documentXml.async("text");
      const text = extractTextFromXml(xmlContent);
      if (text.trim()) {
        parts.push(text);
      }
    }

    // Extract headers
    for (const filename of Object.keys(zip.files)) {
      if (filename.match(/^word\/header\d*\.xml$/)) {
        const headerXml = zip.file(filename);
        if (headerXml) {
          const xmlContent = await headerXml.async("text");
          const text = extractTextFromXml(xmlContent);
          if (text.trim()) {
            parts.unshift(text);
          }
        }
      }
    }

    // Extract footers
    for (const filename of Object.keys(zip.files)) {
      if (filename.match(/^word\/footer\d*\.xml$/)) {
        const footerXml = zip.file(filename);
        if (footerXml) {
          const xmlContent = await footerXml.async("text");
          const text = extractTextFromXml(xmlContent);
          if (text.trim()) {
            parts.push(text);
          }
        }
      }
    }

    const result = parts.join("\n\n");
    if (!result.trim()) {
      throw new Error("No text content found in DOCX");
    }
    return result;
  } catch (error) {
    throw new Error(`Failed to extract text from DOCX: ${error}`);
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
      return extractTextFromPdf(buffer);
    case "docx":
    case "doc":
      return extractTextFromDocx(buffer);
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
