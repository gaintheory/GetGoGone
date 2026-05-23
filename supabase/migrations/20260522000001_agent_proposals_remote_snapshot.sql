create table if not exists public.agent_proposals (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  campaign_channel_id uuid references public.campaign_channels(id) on delete cascade,
  generated_output_id uuid references public.generated_outputs(id) on delete set null,
  proposal_type text not null,
  title text not null,
  summary text,
  status text not null default 'pending',
  proposed_payload jsonb not null default '{}'::jsonb,
  review_notes text,
  created_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agent_proposals_status_check
    check (status in ('pending', 'approved', 'rejected'))
);

create index if not exists agent_proposals_dealership_status_idx
  on public.agent_proposals (dealership_id, status, created_at desc);

create index if not exists agent_proposals_campaign_idx
  on public.agent_proposals (campaign_id);

create index if not exists agent_proposals_campaign_channel_idx
  on public.agent_proposals (campaign_channel_id);

create index if not exists agent_proposals_generated_output_idx
  on public.agent_proposals (generated_output_id);

alter table public.agent_proposals enable row level security;
