-- Profile cover/header image URL (Gold+ customization).
-- Images upload into the existing public avatars bucket under {uid}/header/.
alter table public.profiles
  add column if not exists header_url text;

comment on column public.profiles.header_url is
  'Public https URL for the profile cover/header image.';
