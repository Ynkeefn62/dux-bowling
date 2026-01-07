import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";


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

/**
 * Server-side Supabase client
 * - Uses auth cookies automatically
 * - Safe for Route Handlers (app/api/**)
 * - Enforces RLS
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({
            name,
            value,
            ...options
          });
        },
        remove(name: string, options: any) {
          cookieStore.set({
            name,
            value: "",
            ...options,
            maxAge: 0
          });
        }
      }
    }
  );
}