-- Jalankan sekali di Supabase Dashboard > SQL Editor.
-- Membuat satu banner Shopee Affiliate yang bisa dikelola dari Admin.
create table if not exists public.site_banners (
  id smallint primary key check (id = 1),
  image_url text not null,
  target_url text not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.site_banners enable row level security;

drop policy if exists "Public can read active site banner" on public.site_banners;
create policy "Public can read active site banner"
on public.site_banners for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can read all site banners" on public.site_banners;
create policy "Admins can read all site banners"
on public.site_banners for select
to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
));

drop policy if exists "Admins can insert site banners" on public.site_banners;
create policy "Admins can insert site banners"
on public.site_banners for insert
to authenticated
with check (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
));

drop policy if exists "Admins can update site banners" on public.site_banners;
create policy "Admins can update site banners"
on public.site_banners for update
to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
))
with check (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
));

drop policy if exists "Admins can delete site banners" on public.site_banners;
create policy "Admins can delete site banners"
on public.site_banners for delete
to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
));
