alter table public.agent_proposals
  add column if not exists source_key text,
  add column if not exists agent_type text not null default 'cockpit',
  add column if not exists target_type text,
  add column if not exists target_id text,
  add column if not exists reasoning text,
  add column if not exists risk_level text not null default 'medium',
  add column if not exists decided_at timestamptz;

update public.agent_proposals
set
  source_key = coalesce(source_key, 'proposal:' || id::text),
  target_type = coalesce(
    target_type,
    case
      when campaign_channel_id is not null then 'campaign_channel'
      when campaign_id is not null then 'campaign'
      when generated_output_id is not null then 'generated_output'
      else 'proposal'
    end
  ),
  target_id = coalesce(
    target_id,
    campaign_channel_id::text,
    campaign_id::text,
    generated_output_id::text,
    id::text
  ),
  reasoning = coalesce(reasoning, summary, review_notes),
  decided_at = coalesce(decided_at, reviewed_at)
where
  source_key is null
  or target_type is null
  or target_id is null
  or reasoning is null
  or decided_at is null;

alter table public.agent_proposals
  alter column source_key set not null,
  alter column target_type set not null,
  alter column target_id set not null;

alter table public.agent_proposals
  drop constraint if exists agent_proposals_status_check;

alter table public.agent_proposals
  add constraint agent_proposals_status_check
  check (status in ('pending', 'approved', 'rejected', 'snoozed', 'archived'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'agent_proposals_dealership_source_key_key'
      and conrelid = 'public.agent_proposals'::regclass
  ) then
    alter table public.agent_proposals
      add constraint agent_proposals_dealership_source_key_key
      unique (dealership_id, source_key);
  end if;
end $$;

create index if not exists agent_proposals_dealership_status_updated_idx
  on public.agent_proposals (dealership_id, status, updated_at desc);

create index if not exists agent_proposals_target_idx
  on public.agent_proposals (target_type, target_id);
