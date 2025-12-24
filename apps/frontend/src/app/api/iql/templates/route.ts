import { NextResponse } from "next/server";
import { IQL_TEMPLATES } from "@/lib/iql-templates";

/**
 * GET /api/iql/templates
 *
 * Returns list of available IQL templates.
 */
export async function GET() {
  try {
    return NextResponse.json({
      templates: IQL_TEMPLATES,
    });
  } catch (error) {
    console.error("Templates API error:", error);
    return NextResponse.json(
      { error: "Failed to load templates" },
      { status: 500 },
    );
  }
}
