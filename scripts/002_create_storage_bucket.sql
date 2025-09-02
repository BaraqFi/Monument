-- Create storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Create storage policies
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Anyone can upload avatar images"
  on storage.objects for insert
  with check (bucket_id = 'avatars');

-- Prevent updates and deletes to maintain integrity
create policy "No avatar updates"
  on storage.objects for update
  using (false);

create policy "No avatar deletes"
  on storage.objects for delete
  using (false);
