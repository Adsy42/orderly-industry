import { NextRequest, NextResponse } from "next/server";
import { convertDocxToPdf } from "@/lib/pdf-conversion";

/**
 * POST /api/documents/convert-to-pdf
 * Convert a DOCX file to PDF without saving to database.
 * Used for preview purposes in the contract analyzer.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file type
    const isDocx =
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.toLowerCase().endsWith(".docx");

    if (!isDocx) {
      return NextResponse.json(
        { error: "Only DOCX files can be converted" },
        { status: 400 },
      );
    }

    // Convert to ArrayBuffer
    const docxBuffer = await file.arrayBuffer();

    // Convert DOCX to PDF
    const pdfBuffer = await convertDocxToPdf(docxBuffer, file.name);

    // Return PDF as base64 data URL
    const base64 = Buffer.from(pdfBuffer).toString("base64");

    return NextResponse.json({
      pdf_url: `data:application/pdf;base64,${base64}`,
      source: "converted",
      original_type: "docx",
    });
  } catch (error) {
    console.error("PDF conversion error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Conversion failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
