// src/types.d.ts
import type { PostgrestError } from "@supabase/supabase-js";

// Suppose your "posts" table has a `tags` column:
export type Post = {
  id: string;
  title: string;      
  content: string;    
  author: string;     
  created_at: string; 
  slug: string;
  tags: string[];
};


// If you need the error type as well:
export type SupabaseError = PostgrestError;
