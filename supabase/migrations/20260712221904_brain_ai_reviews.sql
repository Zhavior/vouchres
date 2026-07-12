create table public.brain_ai_reviews (
  review_key text primary key,
  decision_date date not null,
  sport text not null,
  market text not null,
  model text not null,
  status text not null check (status in ('live', 'fallback', 'no_key')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now()
);

alter table public.brain_ai_reviews enable row level security;
revoke all on public.brain_ai_reviews from anon, authenticated;
grant all on public.brain_ai_reviews to service_role;

comment on table public.brain_ai_reviews is
  'Explanation-only Gemini reviews of immutable Brain decisions. Reviews cannot alter scores, rank, or outcomes.';
