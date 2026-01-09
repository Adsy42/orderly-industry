/**
 * PDF Conversion Utilities
 *
 * Handles DOCX to PDF conversion using external APIs.
 * Supports multiple conversion backends for flexibility.
 */

/**
 * Convert DOCX file to PDF using ConvertAPI.
 * Requires CONVERTAPI_SECRET environment variable.
 *
 * @param docxBuffer - The DOCX file as an ArrayBuffer
 * @param filename - Original filename for the conversion
 * @returns PDF as ArrayBuffer
 */
export async function convertDocxToPdf(
  docxBuffer: ArrayBuffer,
  filename: string,
): Promise<ArrayBuffer> {
  const apiSecret = process.env.CONVERTAPI_SECRET;

  if (!apiSecret) {
    throw new Error(
      "CONVERTAPI_SECRET environment variable not set. PDF conversion unavailable.",
    );
  }

  // Convert to base64
  const base64Content = Buffer.from(docxBuffer).toString("base64");

  // Call ConvertAPI
  const response = await fetch(
    `https://v2.convertapi.com/convert/docx/to/pdf?Secret=${apiSecret}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Parameters: [
          {
            Name: "File",
            FileValue: {
              Name: filename,
              Data: base64Content,
            },
          },
          {
            Name: "StoreFile",
            Value: false,
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ConvertAPI error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  if (!result.Files || result.Files.length === 0) {
    throw new Error("ConvertAPI returned no files");
  }

  // Get the PDF data from the response
  const pdfBase64 = result.Files[0].FileData;
  const pdfBuffer = Buffer.from(pdfBase64, "base64");

  return pdfBuffer.buffer.slice(
    pdfBuffer.byteOffset,
    pdfBuffer.byteOffset + pdfBuffer.byteLength,
  );
}

/**
 * Check if a file type requires conversion to PDF.
 */
export function requiresPdfConversion(fileType: string): boolean {
  return fileType === "docx";
}

/**
 * Get the PDF filename for a document.
 */
export function getPdfFilename(originalFilename: string): string {
  // Replace extension with .pdf
  const lastDot = originalFilename.lastIndexOf(".");
  if (lastDot === -1) {
    return `${originalFilename}.pdf`;
  }
  return `${originalFilename.substring(0, lastDot)}.pdf`;
}

/**
 * Get the PDF storage path for a document.
 */
export function getPdfStoragePath(originalStoragePath: string): string {
  // Replace extension with .pdf and add pdf/ prefix
  const parts = originalStoragePath.split("/");
  const filename = parts.pop() || "";
  const pdfFilename = getPdfFilename(filename);
  return [...parts, "pdf", pdfFilename].join("/");
}
