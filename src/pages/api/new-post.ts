import { supabase } from "../../utils/database.ts";

export async function POST({ request }) {
  try {
    const { title, content, author, slug, tags } = await request.json();

    // If tags is optional, you might do:
    // const parsedTags = Array.isArray(tags) ? tags : [];
    // Or if you require tags:
    if (!title || !content || !author || !slug) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Adjust if you want tags to be required:
    // if (!tags || !Array.isArray(tags) || tags.length === 0) { ... }

    const { error } = await supabase
      .from("posts")
      .insert([{ title, content, author, slug, tags }]); // direct insert array

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500 }
    );
  }
}
