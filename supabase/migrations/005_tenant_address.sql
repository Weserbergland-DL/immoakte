-- Add tenant's current address (before move-in) to tenancies
ALTER TABLE public.tenancies
  ADD COLUMN IF NOT EXISTS tenant_street       text,
  ADD COLUMN IF NOT EXISTS tenant_house_number text,
  ADD COLUMN IF NOT EXISTS tenant_zip_code     text,
  ADD COLUMN IF NOT EXISTS tenant_city         text;
