CREATE POLICY "Owners read store assets" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'store-assets' AND public.is_store_owner(((storage.foldername(name))[1])::uuid));