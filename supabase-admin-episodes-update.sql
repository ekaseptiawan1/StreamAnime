-- Jalankan sekali di Supabase Dashboard > SQL Editor.
-- Membuka dukungan episode yang memakai Dropbox atau URL video langsung.
-- Kolom drive_file_id lama dibuat opsional karena Google Drive tidak lagi digunakan.
alter table public.episodes alter column drive_file_id drop not null;
alter table public.episodes drop constraint if exists episodes_anime_id_drive_file_id_key;
create index if not exists episodes_anime_id_episode_number_idx
  on public.episodes (anime_id, episode_number);

-- Hapus kolom embed yang sebelumnya sempat ditambahkan.
alter table public.episodes drop column if exists embed_url;
