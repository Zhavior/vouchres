-- The Express API uses the server-only service_role key. Browser roles remain
-- revoked so chat cannot be read or written directly through the Data API.
grant select, insert, update on table public.world_chat_profiles to service_role;
grant select, insert on table public.world_chat_messages to service_role;
