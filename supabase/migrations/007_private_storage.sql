-- Make protocol-images bucket private (DSGVO compliance)
UPDATE storage.buckets SET public = false WHERE id = 'protocol-images';

-- Replace public read with authenticated owner-only read
DROP POLICY IF EXISTS "Public read protocol images" ON storage.objects;

CREATE POLICY "Authenticated read own protocol images"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'protocol-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
