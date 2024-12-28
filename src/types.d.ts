// src/types.d.ts
import type { PostgrestError } from "@supabase/supabase-js";

export interface Post {
  id: string;
  title: string;
  author: string;
  content: string;
  created_at: string;
}

// If you need the error type as well:
export type SupabaseError = PostgrestError;
