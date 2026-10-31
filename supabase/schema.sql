-- ferroLink: execute this file in the Supabase SQL Editor.
-- New accounts are always candidates by default. Do not allow clients to self-assign privileged roles.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  role text not null default 'candidate'
    check (role in ('candidate','recruiter','recruitment_admin','super_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url',
    'candidate'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text not null default '',
  contract_type text not null default '',
  summary text not null default '',
  description text not null default '',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  job_title text not null default '',
  status text not null default 'pending'
    check (status in ('pending','reviewing','interview','accepted','rejected','withdrawn')),
  cover_letter text not null default '',
  cv_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create or replace function public.is_recruiter()
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce(public.current_user_role() in ('recruiter','recruitment_admin','super_admin'), false)
$$;

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "profiles read own or recruiter" on public.profiles;
create policy "profiles read own or recruiter" on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_recruiter());

drop policy if exists "profiles update own basic details" on public.profiles;
create policy "profiles update own basic details" on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()) and role = (select role from public.profiles p where p.id = (select auth.uid())));

drop policy if exists "published jobs visible" on public.jobs;
create policy "published jobs visible" on public.jobs for select to anon, authenticated
using (status = 'published' or public.is_recruiter());

drop policy if exists "recruiters manage jobs" on public.jobs;
create policy "recruiters manage jobs" on public.jobs for all to authenticated
using (public.is_recruiter()) with check (public.is_recruiter());

drop policy if exists "candidate reads own applications" on public.applications;
create policy "candidate reads own applications" on public.applications for select to authenticated
using (candidate_id = (select auth.uid()) or public.is_recruiter());

drop policy if exists "candidate submits own applications" on public.applications;
create policy "candidate submits own applications" on public.applications for insert to authenticated
with check (candidate_id = (select auth.uid()));

drop policy if exists "recruiters update applications" on public.applications;
create policy "recruiters update applications" on public.applications for update to authenticated
using (public.is_recruiter()) with check (public.is_recruiter());

drop policy if exists "notifications read own" on public.notifications;
create policy "notifications read own" on public.notifications for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "notifications update own" on public.notifications;
create policy "notifications update own" on public.notifications for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Admin-only read view. RLS on applications still applies to the underlying rows.
create or replace view public.applications_admin_view
with (security_invoker = true) as
select a.id, a.job_id, a.job_title, a.status, a.created_at,
       a.candidate_id, p.full_name as candidate_name
from public.applications a
left join public.profiles p on p.id = a.candidate_id;

-- Store CVs in a private Storage bucket named "candidate-cvs".
-- Apply Storage policies separately; never make this bucket public.
