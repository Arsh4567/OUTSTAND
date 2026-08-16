-- Profile polish: richer, editable identity data with safe per-user RLS.
alter table public.profiles
  add column if not exists full_name text,
  add column if not exists bio text,
  add column if not exists username text;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;

alter table public.profiles
  drop constraint if exists profiles_bio_length;

alter table public.profiles
  add constraint profiles_bio_length check (bio is null or char_length(bio) <= 240);

alter table public.profiles
  drop constraint if exists profiles_username_length;

alter table public.profiles
  add constraint profiles_username_length check (username is null or char_length(username) between 3 and 24);

alter table public.profiles
  drop constraint if exists profiles_username_format;

alter table public.profiles
  add constraint profiles_username_format check (username is null or username ~ '^[A-Za-z0-9_]+$');
