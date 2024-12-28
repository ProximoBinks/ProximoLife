import { createClient } from '@supabase/supabase-js';

// Post type, matching your "posts" table columns
export type Post = {
  id: string;        // UUID
  title: string;
  content: string;
  created_at: string;
  author: string;
};

// Our Database schema definition
type Database = {
  public: {
    Tables: {
      posts: {
        Row: Post;
        Insert: Omit<Post, 'id'>;   // If 'id' is auto-generated
        Update: Partial<Post>;
      };
    };
  };
};

// Use environment variables for your Supabase URL & anon key
const supabaseUrl = import.meta.env.SUPABASE_DATABASE_URL;
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY;

/**
 * Creates a typed Supabase client if both env variables exist,
 * otherwise exports null (so you can handle that case gracefully).
 */
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient<Database>(supabaseUrl, supabaseKey)
  : null;
