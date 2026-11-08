import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The project URL and publishable key are public by design: they ship to every browser,
// and access is enforced by row-level security in the database. Environment variables
// override them (e.g. to point a preview at another project).
const DEFAULT_URL = "https://yjkbjljnnikfqvzvzulg.supabase.co";
const DEFAULT_KEY = "sb_publishable_EKV3-GpgUanXNrW8YdZ7Hg_U54bXJHT";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEFAULT_URL;
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || DEFAULT_KEY;

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
export const hasSupabase = !!supabase;
