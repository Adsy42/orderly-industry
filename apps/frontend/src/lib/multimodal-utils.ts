import { ContentBlock } from "@langchain/core/messages";
import { toast } from "sonner";

// Supported image types for chat (PDFs are NOT supported in OpenAI Chat Completions)
// For PDFs, use Matters > Documents and the document agent tools
const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// Returns a Promise of a typed multimodal block for images
export async function fileToContentBlock(
  file: File,
): Promise<ContentBlock.Multimodal.Data> {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    if (file.type === "application/pdf") {
      toast.error(
        "PDFs cannot be attached to chat. Upload to a Matter's Documents section instead.",
      );
    } else {
      toast.error(
        `Unsupported file type: ${file.type}. Supported: JPEG, PNG, GIF, WEBP.`,
      );
    }
    return Promise.reject(new Error(`Unsupported file type: ${file.type}`));
  }

  const data = await fileToBase64(file);

  return {
    type: "image",
    mimeType: file.type,
    data,
    metadata: { name: file.name },
  };
}

// Helper to convert File to base64 string
export async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data:...;base64, prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Type guard for Base64ContentBlock (images only)
export function isBase64ContentBlock(
  block: unknown,
): block is ContentBlock.Multimodal.Data {
  if (typeof block !== "object" || block === null || !("type" in block))
    return false;
  // image type
  if (
    (block as { type: unknown }).type === "image" &&
    "mimeType" in block &&
    typeof (block as { mimeType?: unknown }).mimeType === "string" &&
    (block as { mimeType: string }).mimeType.startsWith("image/")
  ) {
    return true;
  }
  return false;
}
