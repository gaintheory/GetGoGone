create table if not exists public.generated_outputs (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  target_type text not null,
  target_id text,
  task_type text not null,
  provider text not null,
  model text not null,
  language text not null default 'en',
  prompt_context jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.generated_outputs enable row level security;

create index if not exists generated_outputs_dealership_id_idx
  on public.generated_outputs(dealership_id);

create index if not exists generated_outputs_target_idx
  on public.generated_outputs(target_type, target_id);

create index if not exists generated_outputs_task_type_idx
  on public.generated_outputs(task_type);
