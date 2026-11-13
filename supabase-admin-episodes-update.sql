-- Jalankan sekali di Supabase Dashboard > SQL Editor.
-- Membuka dukungan episode yang memakai Dropbox atau URL video langsung.
-- Kolom drive_file_id lama dibuat opsional karena Google Drive tidak lagi digunakan.
alter table public.episodes alter column drive_file_id drop not null;
alter table public.episodes drop constraint if exists episodes_anime_id_drive_file_id_key;
create index if not exists episodes_anime_id_episode_number_idx
  on public.episodes (anime_id, episode_number);

-- Tambahkan kolom untuk URL embed resmi penyedia video (jika belum ada).
alter table public.episodes add column if not exists embed_url text;
