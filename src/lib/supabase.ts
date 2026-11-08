import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Supabase client; null when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
export const hasSupabase = !!supabase;
