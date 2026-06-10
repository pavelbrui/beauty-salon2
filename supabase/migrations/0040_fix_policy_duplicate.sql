-- Fix duplicate policies causing migration errors
DROP POLICY IF EXISTS "stylists_select_public" ON public.stylists;
CREATE POLICY "stylists_select_public" ON public.stylists FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "services_select_public" ON public.services;
CREATE POLICY "services_select_public" ON public.services FOR SELECT TO public USING (true);
