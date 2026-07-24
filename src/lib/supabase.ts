import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = (url: string | undefined) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

if (!isValidUrl(supabaseUrl) || !supabaseAnonKey || supabaseAnonKey.startsWith("YOUR_")) {
  console.warn("Missing or invalid Supabase environment variables. Please check your .env.local file.");
}

export const supabase = createClient(
  isValidUrl(supabaseUrl) ? supabaseUrl : "https://placeholder-url.supabase.co",
  (supabaseAnonKey && !supabaseAnonKey.startsWith("YOUR_")) ? supabaseAnonKey : "placeholder-key"
);
