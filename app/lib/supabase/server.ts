import { createClient } from "@supabase/supabase-js";

function must(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required.`);
  return v;
}

export function supabaseAnonServer() {
  const url = must("NEXT_PUBLIC_SUPABASE_URL");
  const anon = must("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function supabaseAdminServer() {
  const url = must("NEXT_PUBLIC_SUPABASE_URL");
  const service = must("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}