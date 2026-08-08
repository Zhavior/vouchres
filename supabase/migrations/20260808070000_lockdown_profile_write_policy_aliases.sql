-- Repair legacy profile policies that allow browser clients to write
-- unrestricted profile columns. Legitimate profile writes use the backend
-- service-role client and do not require authenticated-user write policies.

drop policy if exists "Allow individual insert access" on public.profiles;
drop policy if exists "Allow individual read access" on public.profiles;
drop policy if exists "Allow individual update access" on public.profiles;
