import { supabase } from "../../utils/database.js";

export const POST = async ({ request }: { request: Request }) => {
  try {
    const { slug } = await request.json();

    if (!slug) {
      return new Response(JSON.stringify({ error: "Missing slug" }), { status: 400 });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Supabase client not initialized" }), { status: 500 });
    }

    // ✅ Fetch current views
    const { data, error } = await supabase
      .from("posts")
      .select("views")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Post not found" }), { status: 404 });
    }

    // ✅ Check if user already viewed this post (Simulating a user session via localStorage)
    const viewedPosts = JSON.parse(request.headers.get("X-Viewed-Posts") || "[]");

    if (viewedPosts.includes(slug)) {
      return new Response(JSON.stringify({ success: true, newViews: data.views }), { status: 200 });
    }
    
    // ✅ Increment view count
    const newViews = data.views + 1;
    const { error: updateError } = await supabase
      .from("posts")
      .update({ views: newViews })
      .eq("slug", slug);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, newViews }), { status: 200 });
  } catch (err: unknown) {
    const error = err as Error;
    return new Response(
      JSON.stringify({ error: "Server error", details: error.message }),
      { status: 500 }
    );
  }
};
