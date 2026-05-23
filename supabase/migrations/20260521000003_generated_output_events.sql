create table if not exists public.generated_output_events (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid references public.dealerships(id) on delete cascade,
  generated_output_id uuid references public.generated_outputs(id) on delete cascade,
  event_type text not null,
  actor_type text not null default 'operator',
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists generated_output_events_output_idx
  on public.generated_output_events(generated_output_id, created_at desc);

create index if not exists generated_output_events_dealership_idx
  on public.generated_output_events(dealership_id, created_at desc);

alter table public.generated_output_events enable row level security;
