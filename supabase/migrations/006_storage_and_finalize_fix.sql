-- 1. Create protocol-images storage bucket
INSERT INTO storage.buckets (id, name, public, allowed_mime_types)
VALUES ('protocol-images', 'protocol-images', true, ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif'])
ON CONFLICT (id) DO NOTHING;

-- 2. Storage policies
DROP POLICY IF EXISTS "Authenticated users can upload protocol images" ON storage.objects;
CREATE POLICY "Authenticated users can upload protocol images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'protocol-images');

DROP POLICY IF EXISTS "Public read protocol images" ON storage.objects;
CREATE POLICY "Public read protocol images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'protocol-images');

DROP POLICY IF EXISTS "Users can delete own protocol images" ON storage.objects;
CREATE POLICY "Users can delete own protocol images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'protocol-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Atomic finalize function (prevents race condition)
CREATE OR REPLACE FUNCTION public.finalize_protocol(
  p_protocol_id uuid,
  p_owner_id     uuid
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_status  text;
  v_count   integer;
BEGIN
  -- Lock user row so concurrent calls queue up
  SELECT subscription_status INTO v_status
    FROM public.users WHERE id = p_owner_id FOR UPDATE;

  IF v_status IS DISTINCT FROM 'active' THEN
    SELECT COUNT(*) INTO v_count
      FROM public.protocols
     WHERE owner_id = p_owner_id AND finalized_at IS NOT NULL;

    IF v_count >= 1 THEN
      RETURN jsonb_build_object('error', 'payment_required');
    END IF;
  END IF;

  UPDATE public.protocols
     SET finalized_at = now(), status = 'final'
   WHERE id = p_protocol_id AND owner_id = p_owner_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
