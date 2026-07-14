// ============================================================
// DUX BOWLING - SUPABASE WIRING (edit this ONE file to go live)
// 1. Supabase Dashboard -> Project Settings -> API
// 2. Paste "Project URL" and "anon public" key below
// 3. Run supabase-migration.sql in the SQL editor (once)
// 4. Auth -> URL Configuration -> add your site URL + /demo/join.html
//    to Redirect URLs (for magic-link account creation)
// Until then: live demo runs in LOCAL MODE (tabs on one device),
// and the survey stores a preview instead of submitting.
// ============================================================
window.DUX_SUPABASE = {
  url: "__SUPABASE_URL__",
  anonKey: "__SUPABASE_ANON_KEY__",
  configured() { return !this.url.startsWith("__"); }
};
