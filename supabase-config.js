// Isi dengan Project URL dan anon/public key dari Supabase Dashboard > Project Settings > API.
// Aman untuk frontend hanya jika Row Level Security (RLS) dan policy pada supabase-schema.sql sudah diterapkan.
// JANGAN pernah menaruh service_role key atau password database di file ini.
window.SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
window.SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
window.STORAGE_BUCKET = "anime-videos";