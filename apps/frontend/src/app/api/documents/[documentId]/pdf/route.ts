import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  convertDocxToPdf,
  requiresPdfConversion,
  getPdfStoragePath,
  getPdfFilename,
} from "@/lib/pdf-conversion";

interface RouteContext {
  params: Promise<{ documentId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    console.log("[PDF API] Starting...");

    const { documentId } = await context.params;
    console.log("[PDF API] Document ID:", documentId);

    const force = request.nextUrl.searchParams.get("force") === "true";

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 },
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch document details
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // If document is already a PDF, just return signed URL
    if (document.file_type === "pdf") {
      const { data: signedUrl, error: signError } = await supabase.storage
        .from("documents")
        .createSignedUrl(document.storage_path, 3600);

      if (signError || !signedUrl) {
        return NextResponse.json(
          { error: "Failed to generate signed URL" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        pdf_url: signedUrl.signedUrl,
        source: "original",
        file_type: "pdf",
      });
    }

    // Check if we need to convert (DOCX)
    if (!requiresPdfConversion(document.file_type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type for PDF viewing: ${document.file_type}`,
        },
        { status: 400 },
      );
    }

    // Check if PDF already exists (cached conversion)
    if (document.pdf_storage_path && !force) {
      const { data: signedUrl, error: signError } = await supabase.storage
        .from("documents")
        .createSignedUrl(document.pdf_storage_path, 3600);

      if (!signError && signedUrl) {
        return NextResponse.json({
          pdf_url: signedUrl.signedUrl,
          source: "cached",
          file_type: "pdf",
          original_type: document.file_type,
        });
      }
    }

    // Download the original DOCX file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(document.storage_path);

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: "Failed to download document" },
        { status: 500 },
      );
    }

    // Convert DOCX to PDF
    let pdfBuffer: ArrayBuffer;
    try {
      const docxBuffer = await fileData.arrayBuffer();
      pdfBuffer = await convertDocxToPdf(docxBuffer, document.filename);
    } catch (conversionError) {
      console.error("PDF conversion failed:", conversionError);
      const errorMsg =
        conversionError instanceof Error
          ? conversionError.message
          : "PDF conversion failed";
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    // Upload PDF to storage
    const pdfStoragePath = getPdfStoragePath(document.storage_path);
    const pdfFilename = getPdfFilename(document.filename);

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(
        pdfStoragePath,
        new Blob([pdfBuffer], { type: "application/pdf" }),
        {
          contentType: "application/pdf",
          upsert: true,
        },
      );

    if (uploadError) {
      console.error("Failed to upload converted PDF:", uploadError);
      const base64 = Buffer.from(pdfBuffer).toString("base64");
      return NextResponse.json({
        pdf_url: `data:application/pdf;base64,${base64}`,
        source: "inline",
        file_type: "pdf",
        original_type: document.file_type,
        cache_error: uploadError.message,
      });
    }

    // Update document with PDF path
    await supabase
      .from("documents")
      .update({
        pdf_storage_path: pdfStoragePath,
        pdf_generated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    // Get signed URL for the uploaded PDF
    const { data: signedUrl, error: signError } = await supabase.storage
      .from("documents")
      .createSignedUrl(pdfStoragePath, 3600);

    if (signError || !signedUrl) {
      const base64 = Buffer.from(pdfBuffer).toString("base64");
      return NextResponse.json({
        pdf_url: `data:application/pdf;base64,${base64}`,
        source: "inline",
        file_type: "pdf",
        original_type: document.file_type,
      });
    }

    return NextResponse.json({
      pdf_url: signedUrl.signedUrl,
      source: "converted",
      file_type: "pdf",
      original_type: document.file_type,
      pdf_filename: pdfFilename,
    });
  } catch (error) {
    console.error("PDF API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
