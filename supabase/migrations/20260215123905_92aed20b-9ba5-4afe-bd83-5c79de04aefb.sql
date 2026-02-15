-- Add missing UPDATE and DELETE policies for addresses table

-- Users can update their own addresses
CREATE POLICY "Users can update their own addresses"
ON public.addresses FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = addresses.customer_id
    AND customers.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = addresses.customer_id
    AND customers.user_id = auth.uid()
  )
);

-- Users can delete their own addresses
CREATE POLICY "Users can delete their own addresses"
ON public.addresses FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = addresses.customer_id
    AND customers.user_id = auth.uid()
  )
);

-- Admins can update all addresses
CREATE POLICY "Admins can update all addresses"
ON public.addresses FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can delete addresses
CREATE POLICY "Admins can delete addresses"
ON public.addresses FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix update_updated_at_column function search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;