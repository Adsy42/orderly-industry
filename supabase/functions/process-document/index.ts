import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Document processing constants
const CHUNK_SIZE = 2000; // Characters (~500 tokens)
const CHUNK_OVERLAP = 200;
const MAX_RETRIES = 3;
const VISION_PAGES_PER_BATCH = 5; // Google Vision API limit

interface DocumentRecord {
  id: string;
  matter_id: string;
  storage_path: string;
  filename: string;
  file_type: string;
  processing_status: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: DocumentRecord;
  old_record?: DocumentRecord;
}

// Update document status in database
async function updateDocumentStatus(
  supabase: ReturnType<typeof createClient>,
  documentId: string,
  status: string,
  updates: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabase
    .from("documents")
    .update({
      processing_status: status,
      ...updates,
    })
    .eq("id", documentId);

  if (error) {
    console.error(`Failed to update document status: ${error.message}`);
    throw error;
  }
}

// --- Google Cloud Vision OCR ---

/**
 * OCR a PDF using Google Cloud Vision files:annotate.
 * Processes 5 pages per request (API limit), batching for longer documents.
 */
async function ocrPdf(
  content: Uint8Array,
  visionApiKey: string,
): Promise<string> {
  const base64Content = btoa(
    Array.from(content)
      .map((b) => String.fromCharCode(b))
      .join(""),
  );

  const allText: string[] = [];
  let pageOffset = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    const pages = Array.from(
      { length: VISION_PAGES_PER_BATCH },
      (_, i) => pageOffset + i,
    );

    const response = await fetch(
      `https://vision.googleapis.com/v1/files:annotate?key=${visionApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      },
    );

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

// --- TXT extraction ---

function extractTextFromTxt(content: Uint8Array): string {
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    return decoder.decode(content);
  } catch {
    const decoder = new TextDecoder("latin1");
    return decoder.decode(content);
  }
}

// --- Text extraction dispatch ---

async function extractText(
  content: Uint8Array,
  fileType: string,
  visionApiKey: string,
): Promise<string> {
  switch (fileType.toLowerCase()) {
    case "pdf":
      return ocrPdf(content, visionApiKey);
    case "txt":
      return extractTextFromTxt(content);
    case "docx":
    case "doc":
      throw new Error(
        "DOCX/DOC files must be processed via the /api/documents/process route (requires LibreOffice for conversion to PDF before OCR)",
      );
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

// Split text into overlapping chunks
function chunkText(text: string): string[] {
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

      // Split by sentence
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

// Call Isaacus API to generate embeddings with retry logic
// API docs: https://docs.isaacus.com/api-reference/embeddings
async function generateEmbeddings(
  texts: string[],
  isaacusApiKey: string,
  isaacusBaseUrl: string,
): Promise<number[][]> {
  const allEmbeddings: number[][] = [];

  // Isaacus API base URL includes /v1, so endpoint is just /embeddings
  // Base URL should be https://api.isaacus.com/v1
  const baseUrl = isaacusBaseUrl.endsWith("/v1")
    ? isaacusBaseUrl
    : `${isaacusBaseUrl}/v1`;
  const endpoint = `${baseUrl}/embeddings`;
  console.log(`Calling Isaacus API: ${endpoint} for ${texts.length} chunks`);

  // Process in smaller batches to avoid token limits
  const BATCH_SIZE = 5;

  for (
    let batchStart = 0;
    batchStart < texts.length;
    batchStart += BATCH_SIZE
  ) {
    const batch = texts.slice(batchStart, batchStart + BATCH_SIZE);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${isaacusApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            texts: batch, // Isaacus uses 'texts' field
            model: "kanon-2-embedder",
            task: "retrieval/document", // Add task parameter for embeddings
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Isaacus API error response: ${errorText}`);
          throw new Error(
            `Isaacus API error: ${response.status} - ${errorText}`,
          );
        }

        const data = await response.json();
        console.log(`Isaacus response keys: ${Object.keys(data).join(", ")}`);
        // Isaacus returns { embeddings: [{ index: 0, embedding: [...] }, ...] }
        let batchEmbeddings: number[][];
        if (data.embeddings && Array.isArray(data.embeddings)) {
          // Check if embeddings are objects with 'embedding' field or direct arrays
          if (
            data.embeddings[0] &&
            typeof data.embeddings[0] === "object" &&
            "embedding" in data.embeddings[0]
          ) {
            // Format: { embeddings: [{ index: 0, embedding: [...] }, ...] }
            batchEmbeddings = data.embeddings.map(
              (item: { embedding: number[] }) => item.embedding,
            );
          } else {
            // Format: { embeddings: [[...], [...], ...] }
            batchEmbeddings = data.embeddings;
          }
        } else if (data.data && Array.isArray(data.data)) {
          batchEmbeddings = data.data.map(
            (item: { embedding: number[] }) => item.embedding,
          );
        } else {
          throw new Error(
            `Unexpected Isaacus response format: ${JSON.stringify(data).slice(0, 200)}`,
          );
        }
        allEmbeddings.push(...batchEmbeddings);
        break; // Success, move to next batch
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `Embedding batch ${batchStart / BATCH_SIZE + 1} attempt ${attempt + 1} failed: ${lastError.message}`,
        );

        if (attempt < MAX_RETRIES - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000),
          );
        } else {
          throw lastError;
        }
      }
    }
  }

  return allEmbeddings;
}

// Store embeddings in database
async function storeEmbeddings(
  supabase: ReturnType<typeof createClient>,
  documentId: string,
  chunks: string[],
  embeddings: number[][],
): Promise<void> {
  const records = chunks.map((chunk, index) => ({
    document_id: documentId,
    chunk_index: index,
    chunk_text: chunk,
    embedding: embeddings[index],
  }));

  // Delete existing embeddings for this document
  await supabase
    .from("document_embeddings")
    .delete()
    .eq("document_id", documentId);

  // Insert new embeddings in batches
  const BATCH_SIZE = 50;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("document_embeddings").insert(batch);

    if (error) {
      console.error(`Failed to insert embeddings batch: ${error.message}`);
      throw error;
    }
  }
}

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse webhook payload
    const payload: WebhookPayload = await req.json();

    // Only process INSERT events for pending documents
    if (payload.type !== "INSERT") {
      return new Response(
        JSON.stringify({ message: "Skipping non-INSERT event" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const document = payload.record;

    if (document.processing_status !== "pending") {
      return new Response(
        JSON.stringify({ message: "Document not in pending status" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Processing document: ${document.id} (${document.filename})`);

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const isaacusApiKey = Deno.env.get("ISAACUS_API_KEY");
    const isaacusBaseUrl =
      Deno.env.get("ISAACUS_BASE_URL") || "https://api.isaacus.com";
    const visionApiKey = Deno.env.get("GOOGLE_VISION_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
      // Step 1: Update status to extracting
      await updateDocumentStatus(supabase, document.id, "extracting");

      // Step 2: Download file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("documents")
        .download(document.storage_path);

      if (downloadError || !fileData) {
        throw new Error(`Failed to download file: ${downloadError?.message}`);
      }

      // Step 3: Extract text via Google Cloud Vision OCR
      if (!visionApiKey) {
        throw new Error(
          "GOOGLE_VISION_API_KEY not set - required for document OCR",
        );
      }

      const fileContent = new Uint8Array(await fileData.arrayBuffer());
      const extractedText = await extractText(
        fileContent,
        document.file_type,
        visionApiKey,
      );

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error("No text could be extracted from document");
      }

      console.log(
        `Extracted ${extractedText.length} characters from ${document.filename}`,
      );

      // Step 4: Update status to embedding and save extracted text
      await updateDocumentStatus(supabase, document.id, "embedding", {
        extracted_text: extractedText,
      });

      // Step 5: Generate embeddings if Isaacus key is available
      if (isaacusApiKey) {
        const chunks = chunkText(extractedText);
        console.log(`Document split into ${chunks.length} chunks`);

        if (chunks.length > 0) {
          const embeddings = await generateEmbeddings(
            chunks,
            isaacusApiKey,
            isaacusBaseUrl,
          );

          // Step 6: Store embeddings
          await storeEmbeddings(supabase, document.id, chunks, embeddings);
        }
      } else {
        console.warn("ISAACUS_API_KEY not set, skipping embedding generation");
      }

      // Step 7: Update status to ready
      await updateDocumentStatus(supabase, document.id, "ready", {
        processed_at: new Date().toISOString(),
      });

      console.log(`Document processed successfully: ${document.id}`);

      return new Response(
        JSON.stringify({ success: true, documentId: document.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (error) {
      // Update status to error - handle object errors properly
      let errorMessage: string;
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        errorMessage = JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }
      console.error(`Document processing failed: ${errorMessage}`);

      await updateDocumentStatus(supabase, document.id, "error", {
        error_message: errorMessage,
      });

      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    console.error(`Request handling failed: ${error}`);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
