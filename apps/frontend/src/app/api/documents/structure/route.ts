import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type {
  DocumentSection,
  DocumentStructureResponse,
} from "@/types/documents";

/**
 * Document Structure API Route
 *
 * Gets the hierarchical section tree for a document.
 *
 * GET /api/documents/structure?document_id=<uuid>
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get("document_id");

    if (!documentId) {
      return NextResponse.json(
        { error: "document_id is required" },
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
      .select("id, filename, structure_extracted")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Fetch sections using the database function
    const { data: sections, error: sectionsError } = await supabase.rpc(
      "get_section_tree",
      { doc_uuid: documentId },
    );

    if (sectionsError) {
      console.error("Error fetching sections:", sectionsError);
      return NextResponse.json(
        { error: "Failed to fetch document structure" },
        { status: 500 },
      );
    }

    // Build tree structure from flat sections
    const sectionTree = buildSectionTree(sections || []);

    const response: DocumentStructureResponse = {
      document_id: documentId,
      filename: document.filename,
      structure_extracted: document.structure_extracted,
      sections: sectionTree,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Document structure error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Build a tree structure from flat section list.
 * Sections are returned ordered by path from the database function.
 */
function buildSectionTree(
  flatSections: Array<{
    id: string;
    parent_section_id: string | null;
    section_number: string | null;
    title: string | null;
    level: number;
    sequence: number;
    path: string[];
    start_page: number | null;
    end_page: number | null;
  }>,
): DocumentSection[] {
  const sectionMap = new Map<string, DocumentSection>();
  const rootSections: DocumentSection[] = [];

  // First pass: create all section objects
  for (const section of flatSections) {
    const docSection: DocumentSection = {
      id: section.id,
      document_id: "", // Will be set by caller
      parent_section_id: section.parent_section_id,
      section_number: section.section_number,
      title: section.title,
      level: section.level,
      sequence: section.sequence,
      path: section.path,
      start_page: section.start_page,
      end_page: section.end_page,
      created_at: new Date().toISOString(),
      children: [],
    };
    sectionMap.set(section.id, docSection);
  }

  // Second pass: build tree
  for (const section of flatSections) {
    const docSection = sectionMap.get(section.id);
    if (!docSection) continue;

    if (section.parent_section_id) {
      const parent = sectionMap.get(section.parent_section_id);
      if (parent && parent.children) {
        parent.children.push(docSection);
      }
    } else {
      rootSections.push(docSection);
    }
  }

  // Sort children by sequence
  const sortChildren = (sections: DocumentSection[]) => {
    sections.sort((a, b) => a.sequence - b.sequence);
    for (const section of sections) {
      if (section.children && section.children.length > 0) {
        sortChildren(section.children);
      }
    }
  };

  sortChildren(rootSections);

  return rootSections;
}
