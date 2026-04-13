-- =============================================
-- Protokoll-Pro: Tenancies as first-class objects
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Create tenancies table
CREATE TABLE IF NOT EXISTS public.tenancies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  tenant_salutation text,
  tenant_first_name text,
  tenant_last_name text,
  tenant_email text,
  tenant_phone text,
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Add tenancy_id to protocols
ALTER TABLE public.protocols
  ADD COLUMN IF NOT EXISTS tenancy_id uuid REFERENCES public.tenancies(id) ON DELETE SET NULL;

-- 3. Add tenancy_id to documents (keep protocol_id for now as nullable)
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS tenancy_id uuid REFERENCES public.tenancies(id) ON DELETE CASCADE;

-- 4. Migrate existing data:
--    Create a tenancy for each Einzug protocol (use same UUID for backward compat)
INSERT INTO public.tenancies (id, owner_id, property_id, tenant_salutation, tenant_first_name, tenant_last_name, tenant_email, tenant_phone, start_date, created_at)
SELECT
  p.id,
  p.owner_id,
  p.property_id,
  p.tenant_salutation,
  p.tenant_first_name,
  p.tenant_last_name,
  p.tenant_email,
  p.tenant_phone,
  p.date::date,
  p.created_at
FROM public.protocols p
WHERE p.type = 'Einzug'
ON CONFLICT (id) DO NOTHING;

-- 5. Link Einzug protocols to their tenancy (same ID)
UPDATE public.protocols
SET tenancy_id = id
WHERE type = 'Einzug' AND tenancy_id IS NULL;

-- 6. Link Auszug protocols via linked_protocol_id
UPDATE public.protocols p
SET tenancy_id = linked.tenancy_id
FROM public.protocols linked
WHERE p.linked_protocol_id = linked.id
  AND p.tenancy_id IS NULL
  AND linked.tenancy_id IS NOT NULL;

-- 7. Link existing documents to tenancy via their protocol_id
UPDATE public.documents d
SET tenancy_id = p.tenancy_id
FROM public.protocols p
WHERE d.protocol_id = p.id
  AND d.tenancy_id IS NULL
  AND p.tenancy_id IS NOT NULL;

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_tenancies_owner ON public.tenancies(owner_id);
CREATE INDEX IF NOT EXISTS idx_protocols_tenancy ON public.protocols(tenancy_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenancy ON public.documents(tenancy_id);

-- 9. Trigger for updated_at
DROP TRIGGER IF EXISTS update_tenancies_updated_at ON public.tenancies;
CREATE TRIGGER update_tenancies_updated_at
  BEFORE UPDATE ON public.tenancies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 10. RLS
ALTER TABLE public.tenancies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own tenancies" ON public.tenancies;
CREATE POLICY "Users manage own tenancies"
  ON public.tenancies FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
