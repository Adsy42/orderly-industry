import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * PATCH /api/iql/saved/:id
 *
 * Update an existing saved IQL query.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, query_string, matter_id } = body;

    // Build update object with only provided fields
    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined)
      updates.description = description?.trim() || null;
    if (query_string !== undefined) updates.query_string = query_string.trim();
    if (matter_id !== undefined) updates.matter_id = matter_id || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("saved_iql_queries")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating saved query:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Saved query not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Failed to update saved query" },
        { status: 500 },
      );
    }

    return NextResponse.json({ query: data });
  } catch (error) {
    console.error("Saved queries API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/iql/saved/:id
 *
 * Delete a saved IQL query.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { error } = await supabase
      .from("saved_iql_queries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting saved query:", error);
      return NextResponse.json(
        { error: "Failed to delete saved query" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Saved queries API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
