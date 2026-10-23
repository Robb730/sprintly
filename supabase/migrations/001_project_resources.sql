-- Migration: project_resources table
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)

create table if not exists public.project_resources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  url text not null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast lookups
create index if not exists project_resources_project_id_idx on public.project_resources(project_id);

-- Enable RLS
alter table public.project_resources enable row level security;

-- Policy: any project member can view resources
create policy "Members can view project resources"
  on public.project_resources for select
  using (
    exists (
      select 1 from public.project_members
      where project_members.project_id = project_resources.project_id
        and project_members.user_id = auth.uid()
    )
  );

-- Policy: any project member can add resources
create policy "Members can add project resources"
  on public.project_resources for insert
  with check (
    exists (
      select 1 from public.project_members
      where project_members.project_id = project_resources.project_id
        and project_members.user_id = auth.uid()
    )
    and created_by = auth.uid()
  );

-- Policy: creator (or project manager) can update
create policy "Creator or PM can update resources"
  on public.project_resources for update
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.project_members
      where project_members.project_id = project_resources.project_id
        and project_members.user_id = auth.uid()
        and project_members.role = 'manager'
    )
  );

-- Policy: creator (or project manager) can delete
create policy "Creator or PM can delete resources"
  on public.project_resources for delete
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.project_members
      where project_members.project_id = project_resources.project_id
        and project_members.user_id = auth.uid()
        and project_members.role = 'manager'
    )
  );

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists project_resources_updated_at on public.project_resources;
create trigger project_resources_updated_at
  before update on public.project_resources
  for each row execute function public.set_updated_at();
