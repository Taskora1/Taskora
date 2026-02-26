-- Taskora: Storage Policies (Run after creating the 'proofs' bucket)
-- Create bucket in UI: Storage -> New bucket -> name: proofs, Public OFF

-- Enable RLS on storage objects (should already be enabled in Supabase, but safe to run)
alter table storage.objects enable row level security;

-- Users can upload only into their own folder: {user_id}/...
create policy "proofs: user upload own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read only their own proof files
create policy "proofs: user read own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Admin can read all proof files
create policy "proofs: admin read all"
on storage.objects for select
to authenticated
using (
  bucket_id = 'proofs'
  and public.is_admin()
);
