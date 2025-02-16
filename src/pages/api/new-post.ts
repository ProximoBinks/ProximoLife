import { supabase } from "../../utils/database.ts";

export const POST = async ({ request }) => {
  try {
    const { title, content, author, slug } = await request.json();

    if (!title || !content || !author || !slug) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const { error } = await supabase.from("posts").insert([{ title, content, author, slug }]);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
};