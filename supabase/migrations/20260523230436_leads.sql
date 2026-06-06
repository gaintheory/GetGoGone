-- Extend the pre-existing leads table with day-1 columns we need:
--   * channel-level attribution (campaign_channel_id)
--   * inbound web-inquiry tracking (utm, inbound_url, inbound_ip, inbound_user_agent)
--   * a free-form notes field
--   * a structured source_channel slug separate from the existing free-text "source"
--
-- Plus: add lead_activities for the contact-attempt log.

-- ─── leads additive columns ──────────────────────────────────────────────────
alter table public.leads
  add column if not exists campaign_channel_id uuid
    references public.campaign_channels(id) on delete set null;

alter table public.leads
  add column if not exists source_channel text;

alter table public.leads
  add column if not exists utm jsonb not null default '{}'::jsonb;

alter table public.leads
  add column if not exists inbound_url text;

alter table public.leads
  add column if not exists inbound_ip text;

alter table public.leads
  add column if not exists inbound_user_agent text;

alter table public.leads
  add column if not exists notes text;

-- Index for the new attribution column
create index if not exists leads_campaign_channel_id_idx
  on public.leads(campaign_channel_id);

create index if not exists leads_created_at_idx
  on public.leads(created_at desc);

-- Tighten status to the lifecycle the UI exposes. The core migration left it
-- unconstrained; we add the constraint only if it doesn't already exist.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'leads_status_check'
  ) then
    alter table public.leads
      add constraint leads_status_check
      check (status in ('new', 'contacted', 'appointment', 'sold', 'lost'));
  end if;
end $$;


-- ─── lead_activities (contact-attempt log) ───────────────────────────────────
create table if not exists public.lead_activities (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references public.leads(id) on delete cascade,
  dealership_id uuid not null references public.dealerships(id) on delete cascade,

  activity_type text not null,
  -- Common values:
  --   note, call_attempt, call_connected, sms_sent, email_sent,
  --   appointment_scheduled, status_change, viewed_vehicle
  body          text,
  metadata      jsonb not null default '{}'::jsonb,

  actor         text,

  occurred_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists lead_activities_lead_id_idx
  on public.lead_activities(lead_id);
create index if not exists lead_activities_occurred_at_idx
  on public.lead_activities(occurred_at desc);
create index if not exists lead_activities_dealership_id_idx
  on public.lead_activities(dealership_id);

alter table public.lead_activities enable row level security;
