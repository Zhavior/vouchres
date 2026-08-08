-- Keep server-only access stable in local Supabase, CI, and the linked project.
-- Browser access remains restricted by the per-table RLS policies below.
grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
