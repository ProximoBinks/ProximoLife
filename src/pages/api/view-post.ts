import { supabase } from "../../utils/database.ts";

export const POST = async ({ request }) => {
  try {
    const { slug } = await request.json();

    if (!slug) {
      return new Response(JSON.stringify({ error: "Missing slug" }), { status: 400 });
    }

    // 1) Fetch the current view count
    const { data, error } = await supabase
      .from("posts")
      .select("views")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Post not found" }), { status: 404 });
    }

    // 2) Increment views
    const { error: updateError } = await supabase
      .from("posts")
      .update({ views: data.views + 1 })
      .eq("slug", slug);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
    }

    return new Response(
      JSON.stringify({ success: true, newViews: data.views + 1 }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Server error", details: err.message }),
      { status: 500 }
    );
  }
};
