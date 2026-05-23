create table if not exists public.agent_proposals (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid references public.dealerships(id) on delete cascade,
  source_key text not null,
  agent_type text not null default 'cockpit',
  target_type text not null,
  target_id text not null,
  proposal_type text not null,
  title text not null,
  reasoning text,
  proposed_payload jsonb not null default '{}'::jsonb,
  risk_level text not null default 'medium',
  status text not null default 'pending',
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(dealership_id, source_key)
);

create index if not exists agent_proposals_dealership_status_idx
  on public.agent_proposals(dealership_id, status, updated_at desc);

alter table public.agent_proposals enable row level security;
