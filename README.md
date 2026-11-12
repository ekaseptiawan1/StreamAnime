# StreamAnime

Website katalog dan streaming anime sederhana dengan dashboard admin. Frontend menggunakan HTML, CSS, JavaScript; autentikasi, database, dan penyimpanan video menggunakan Supabase.

## Fitur
- Katalog anime dan pencarian judul/genre.
- Pemutar video HTML5 dengan dukungan link Dropbox dan URL video langsung.
- Login admin melalui Supabase Auth.
- Dashboard tambah, edit, dan hapus anime.
- Upload MP4, WebM, atau OGG ke Supabase Storage.
- Link video Dropbox dapat digunakan tanpa Google Drive API.
- Row Level Security (RLS) untuk membatasi perubahan hanya kepada admin.
- Tampilan responsif untuk ponsel dan desktop.

## 1. Siapkan Supabase
1. Buat project di https://supabase.com/.
2. Buka **Project Settings > API**. Salin Project URL dan anon/public key.
3. Edit `supabase-config.js` dan isi `SUPABASE_URL` serta `SUPABASE_ANON_KEY`. Jangan pernah memasukkan service_role key ke frontend.
4. Buka **SQL Editor**, jalankan seluruh isi `supabase-schema.sql`.
5. Buka **Authentication > Users**, buat user admin.
6. Salin UUID user tersebut. Di SQL Editor jalankan perintah berikut dengan UUID yang benar:

```sql
insert into public.profiles (id, role)
values ('UUID_USER_ADMIN', 'admin')
on conflict (id) do update set role = 'admin';
```

## 2. Publikasikan dengan GitHub Pages
1. Buka repository **Settings > Pages**.
2. Pada **Build and deployment**, pilih **Deploy from a branch**.
3. Pilih branch **main** dan folder **/(root)**, lalu tekan **Save**.
4. Tunggu deployment selesai. GitHub akan menampilkan URL website di halaman Pages.

Halaman admin: `/admin.html`.

## 3. Catatan
- Gunakan hanya video dan poster yang kamu miliki atau punya izin untuk didistribusikan.
- File konfigurasi hanya boleh berisi Supabase Project URL dan anon/public key. Jangan commit service_role key, password, atau kredensial rahasia.
- RLS pada SQL wajib diterapkan sebelum website digunakan.
- Upload dibatasi 100 MB per file pada konfigurasi awal. Untuk file besar, gunakan Supabase Resumable Upload/TUS dan sesuaikan kuota project.
- Bucket video bersifat publik agar pemutar dapat mengakses video. Jangan unggah video privat.
- Menghapus data anime tidak otomatis menghapus file video di Storage; hapus file lama dari Storage Dashboard jika sudah tidak digunakan.
