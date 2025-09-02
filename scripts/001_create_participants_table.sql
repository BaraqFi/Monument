-- Create participants table for Monument dApp
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique,
  x_handle text not null,
  avatar_filename text not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.participants enable row level security;

-- Create policies for participants table
-- Allow anyone to read all participants (for the mural display)
create policy "participants_select_all"
  on public.participants for select
  using (true);

-- Allow anyone to insert their own participant record
create policy "participants_insert_own"
  on public.participants for insert
  with check (true);

-- Prevent updates and deletes to maintain integrity
create policy "participants_no_update"
  on public.participants for update
  using (false);

create policy "participants_no_delete"
  on public.participants for delete
  using (false);
