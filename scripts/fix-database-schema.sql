-- Fix database schema issues and user ID consistency

-- Drop the old users table that conflicts with Stack Auth
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;

-- Update subdomains table to use string user_id for Stack Auth compatibility
ALTER TABLE public.subdomains 
ALTER COLUMN user_id TYPE TEXT;

-- Ensure tenant tables have proper foreign key relationships
ALTER TABLE public.tenant_settings 
ADD CONSTRAINT fk_tenant_settings_subdomain 
FOREIGN KEY (tenant_id) REFERENCES public.subdomains(id) ON DELETE CASCADE;

ALTER TABLE public.tenant_pages 
ADD CONSTRAINT fk_tenant_pages_subdomain 
FOREIGN KEY (tenant_id) REFERENCES public.subdomains(id) ON DELETE CASCADE;

ALTER TABLE public.tenant_posts 
ADD CONSTRAINT fk_tenant_posts_subdomain 
FOREIGN KEY (tenant_id) REFERENCES public.subdomains(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant_id ON public.tenant_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_pages_tenant_id ON public.tenant_pages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_posts_tenant_id ON public.tenant_posts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subdomains_user_id ON public.subdomains(user_id);

-- Add missing columns if they don't exist
ALTER TABLE public.tenant_settings 
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#000000';

ALTER TABLE public.tenant_pages 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

ALTER TABLE public.tenant_posts 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS excerpt TEXT;
