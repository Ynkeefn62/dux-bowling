import { supabaseAnonServer, supabaseAdminServer } from "@/app/lib/supabase/server";
import { getAccessToken } from "@/app/api/auth/_cookies";

export async function requireAdmin(): Promise<{ userId: string } | null> {
  const access = getAccessToken();
  if (!access) return null;

  const anon = supabaseAnonServer();
  const { data: userData } = await anon.auth.getUser(access);
  if (!userData?.user?.id) return null;

  const admin = supabaseAdminServer();
  const { data: profile } = await admin
    .from("profiles")
    .select("user_type")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profile?.user_type !== "admin") return null;
  return { userId: userData.user.id };
}