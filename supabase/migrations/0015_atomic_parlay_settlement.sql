-- 0015_atomic_parlay_settlement.sql
-- Adds the database-owned settlement foundation for 10/10 parlay grading.
-- Goal: child legs + parent pick + settlement audit happen atomically through one RPC.

alter type public.pick_status add value if not exists 'grading';

create table if not exists public.parlay_settlement_audit (
  id uuid primary key default gen_random_uuid(),
  pick_id uuid not null references public.picks(id) on delete cascade,
  settlement_type text not null default 'parlay_settlement',
  status public.pick_status not null,
  settled_units numeric(8,2),
  leg_results jsonb not null default '[]'::jsonb,
  proof jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (pick_id, settlement_type)
);

create index if not exists idx_parlay_settlement_audit_pick_id
  on public.parlay_settlement_audit (pick_id);

alter table public.parlay_settlement_audit enable row level security;

drop policy if exists "service role manages parlay settlement audit"
  on public.parlay_settlement_audit;

create policy "service role manages parlay settlement audit"
  on public.parlay_settlement_audit
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.settle_parlay_packet(
  p_pick_id uuid,
  p_status public.pick_status,
  p_settled_units numeric,
  p_learning_note text,
  p_game_date date,
  p_leg_results jsonb,
  p_proof jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pick public.picks;
  v_now timestamptz := now();
  v_leg_count int := 0;
  v_updated_leg_count int := 0;
  v_audit_id uuid;
begin
  if p_pick_id is null then
    raise exception 'settle_parlay_packet: p_pick_id is required'
      using errcode = 'check_violation';
  end if;

  if p_status not in ('won', 'lost', 'push', 'void', 'graded_error') then
    raise exception 'settle_parlay_packet: terminal p_status required'
      using errcode = 'check_violation';
  end if;

  select *
    into v_pick
    from public.picks
   where id = p_pick_id
     and leg_type = 'parlay'
     and status in ('pending', 'grading')
   for update;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'reason', 'pick_not_pending_or_grading',
      'pick_id', p_pick_id
    );
  end if;

  update public.picks
     set status = 'grading',
         updated_at = v_now
   where id = p_pick_id
     and status in ('pending', 'grading');

  v_leg_count := coalesce(jsonb_array_length(p_leg_results), 0);

  with incoming as (
    select
      (elem->>'leg_index')::int as leg_index,
      (elem->>'status')::public.pick_status as status
    from jsonb_array_elements(p_leg_results) elem
  ),
  updated as (
    update public.pick_legs pl
       set status = incoming.status,
           graded_at = v_now,
           game_date = coalesce(p_game_date, pl.game_date)
      from incoming
     where pl.pick_id = p_pick_id
       and pl.leg_index = incoming.leg_index
       and pl.status in ('pending', 'grading')
       and incoming.status in ('won', 'lost', 'push', 'void', 'graded_error')
     returning pl.id
  )
  select count(*) into v_updated_leg_count from updated;

  if v_updated_leg_count <> v_leg_count then
    raise exception 'settle_parlay_packet: updated % legs, expected %',
      v_updated_leg_count, v_leg_count
      using errcode = 'check_violation';
  end if;

  update public.picks
     set status = p_status,
         settled_units = p_settled_units,
         learning_note = p_learning_note,
         game_date = coalesce(p_game_date, game_date),
         graded_at = v_now,
         updated_at = v_now
   where id = p_pick_id
     and status = 'grading';

  insert into public.parlay_settlement_audit (
    pick_id,
    settlement_type,
    status,
    settled_units,
    leg_results,
    proof
  ) values (
    p_pick_id,
    'parlay_settlement',
    p_status,
    p_settled_units,
    coalesce(p_leg_results, '[]'::jsonb),
    coalesce(p_proof, '{}'::jsonb)
  )
  on conflict (pick_id, settlement_type) do nothing
  returning id into v_audit_id;

  if v_audit_id is null then
    return jsonb_build_object(
      'ok', false,
      'reason', 'settlement_already_audited',
      'pick_id', p_pick_id
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'pick_id', p_pick_id,
    'status', p_status,
    'updated_leg_count', v_updated_leg_count,
    'audit_id', v_audit_id
  );
end;
$$;

revoke all on function public.settle_parlay_packet(
  uuid,
  public.pick_status,
  numeric,
  text,
  date,
  jsonb,
  jsonb
) from public;

grant execute on function public.settle_parlay_packet(
  uuid,
  public.pick_status,
  numeric,
  text,
  date,
  jsonb,
  jsonb
) to service_role;
