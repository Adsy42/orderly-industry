import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * GET /api/iql/saved
 *
 * List all saved IQL queries for the authenticated user.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const matterId = searchParams.get("matter_id");

    let query = supabase
      .from("saved_iql_queries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (matterId) {
      query = query.or(`matter_id.eq.${matterId},matter_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching saved queries:", error);
      return NextResponse.json(
        { error: "Failed to fetch saved queries" },
        { status: 500 },
      );
    }

    return NextResponse.json({ queries: data || [] });
  } catch (error) {
    console.error("Saved queries API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/iql/saved
 *
 * Create a new saved IQL query.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, query_string, matter_id } = body;

    if (!name || !query_string) {
      return NextResponse.json(
        { error: "name and query_string are required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("saved_iql_queries")
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        query_string: query_string.trim(),
        matter_id: matter_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating saved query:", error);
      return NextResponse.json(
        { error: "Failed to create saved query" },
        { status: 500 },
      );
    }

    return NextResponse.json({ query: data }, { status: 201 });
  } catch (error) {
    console.error("Saved queries API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
