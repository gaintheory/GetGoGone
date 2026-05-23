alter table public.agent_proposals
  add column if not exists snoozed_until timestamptz;

create index if not exists agent_proposals_snoozed_until_idx
  on public.agent_proposals (snoozed_until)
  where status = 'snoozed';
