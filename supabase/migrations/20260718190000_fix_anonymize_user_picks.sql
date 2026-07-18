-- anonymize_user_picks previously set user_id = null, which violates
-- picks CHECK (user_id XOR capper_id) and aborted before trust_scores wipe.
-- Hard-delete user-authored picks (legs cascade), then clear trust_scores.
create or replace function public.anonymize_user_picks(p_user_id uuid)
returns void as $$
begin
  delete from public.picks
    where user_id = p_user_id;

  delete from public.trust_scores
    where subject_type = 'user' and subject_id = p_user_id::text;
end;
$$ language plpgsql security definer;
