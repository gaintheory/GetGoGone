create extension if not exists pgcrypto;

create table if not exists public.dealerships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  phone text,
  website_url text,
  finance_application_url text,
  logo_url text,
  brand_colors jsonb not null default '[]'::jsonb,
  default_disclosure text,
  timezone text not null default 'America/Chicago',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key,
  dealership_id uuid references public.dealerships(id) on delete cascade,
  full_name text,
  role text not null default 'salesperson',
  phone text,
  email text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  source_system text,
  source_record_id text,
  source_url text,
  vin text not null,
  stock_number text,
  year integer,
  make text,
  model text,
  trim text,
  body_style text,
  mileage integer,
  exterior_color text,
  interior_color text,
  transmission text,
  drivetrain text,
  engine text,
  fuel_type text,
  price numeric(12,2),
  down_payment numeric(12,2),
  status text not null default 'draft',
  readiness_status text,
  description text,
  notes text,
  first_seen_at timestamptz not null default now(),
  last_synced_at timestamptz,
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dealership_id, vin)
);

create index if not exists vehicles_dealership_status_idx
  on public.vehicles (dealership_id, status);

create index if not exists vehicles_vin_idx
  on public.vehicles (vin);

create table if not exists public.vehicle_photos (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  source_url text,
  storage_path text,
  alt_text text,
  position integer not null default 0,
  is_primary boolean not null default false,
  quality_score numeric(5,2),
  created_at timestamptz not null default now()
);

create index if not exists vehicle_photos_vehicle_position_idx
  on public.vehicle_photos (vehicle_id, position);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  name text not null,
  campaign_type text not null,
  goal text,
  status text not null default 'draft',
  language text not null default 'en',
  audience_type text,
  budget numeric(12,2),
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaigns_dealership_status_idx
  on public.campaigns (dealership_id, status);

create index if not exists campaigns_vehicle_idx
  on public.campaigns (vehicle_id);

create table if not exists public.campaign_channels (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  channel text not null,
  status text not null default 'draft',
  headline text,
  primary_text text,
  description text,
  call_to_action text,
  destination_url text,
  platform_payload jsonb not null default '{}'::jsonb,
  published_url text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaign_channels_campaign_idx
  on public.campaign_channels (campaign_id);

create index if not exists campaign_channels_channel_status_idx
  on public.campaign_channels (channel, status);

create table if not exists public.campaign_assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  campaign_channel_id uuid references public.campaign_channels(id) on delete cascade,
  asset_type text not null,
  format text,
  file_url text,
  storage_path text,
  template_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists campaign_assets_campaign_idx
  on public.campaign_assets (campaign_id);

create table if not exists public.creative_templates (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid references public.dealerships(id) on delete cascade,
  name text not null,
  category text,
  format text not null,
  language text not null default 'en',
  canvas_json jsonb not null default '{}'::jsonb,
  preview_url text,
  is_system boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid references public.dealerships(id) on delete cascade,
  name text not null,
  channel text not null,
  category text,
  language text not null default 'en',
  subject text,
  body text not null,
  tokens jsonb not null default '[]'::jsonb,
  compliance_level text not null default 'standard',
  is_system boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  source_system text,
  source_lead_id text,
  source text,
  first_name text,
  last_name text,
  phone text,
  email text,
  preferred_contact text,
  language_preference text not null default 'en',
  status text not null default 'new',
  assigned_to uuid references public.profiles(id) on delete set null,
  down_payment_available numeric(12,2),
  trade_in boolean,
  appointment_at timestamptz,
  last_contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_dealership_status_idx
  on public.leads (dealership_id, status);

create index if not exists leads_vehicle_idx
  on public.leads (vehicle_id);

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  event_type text not null,
  channel text,
  content text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists lead_events_lead_created_idx
  on public.lead_events (lead_id, created_at desc);

create table if not exists public.marketing_sends (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  name text not null,
  channel text not null,
  template_id uuid references public.message_templates(id) on delete set null,
  subject text,
  body text not null,
  segment jsonb not null default '{}'::jsonb,
  recipient_count integer not null default 0,
  status text not null default 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_send_recipients (
  id uuid primary key default gen_random_uuid(),
  marketing_send_id uuid not null references public.marketing_sends(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  status text not null default 'pending',
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  replied_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  task_type text not null,
  title text not null,
  description text,
  status text not null default 'open',
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_dealership_status_due_idx
  on public.tasks (dealership_id, status, due_at);

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  name text not null,
  trigger_type text not null,
  trigger_config jsonb not null default '{}'::jsonb,
  action_type text not null,
  action_config jsonb not null default '{}'::jsonb,
  delay_minutes integer not null default 0,
  status text not null default 'inactive',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  status text not null default 'queued',
  started_at timestamptz,
  finished_at timestamptz,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null references public.dealerships(id) on delete cascade,
  provider text not null,
  status text not null default 'disconnected',
  credentials_ref text,
  settings jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dealership_id, provider)
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid references public.dealerships(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace view public.inspection_vehicle_source as
select
  i.id::text as source_record_id,
  'internal_inspections'::text as source_system,
  i.vin,
  nullif(i.year, '')::integer as year,
  i.make,
  i.model,
  i.body as body_style,
  nullif(regexp_replace(coalesce(i.miles, ''), '[^0-9]', '', 'g'), '')::integer as mileage,
  i.color as exterior_color,
  i.transmission,
  i.price,
  i.down_payment,
  i.website_copy as description,
  i.remarks as notes,
  i.photo_urls,
  sr.safety_status as readiness_status,
  sr.notes as service_notes,
  greatest(
    coalesce(i.created_at, '-infinity'::timestamptz),
    coalesce(sr.updated_at, '-infinity'::timestamptz),
    coalesce(sr.created_at, '-infinity'::timestamptz)
  ) as source_updated_at
from public.inspections i
left join public.service_records sr on sr.vin = i.vin;

alter table public.dealerships enable row level security;
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_photos enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_channels enable row level security;
alter table public.campaign_assets enable row level security;
alter table public.creative_templates enable row level security;
alter table public.message_templates enable row level security;
alter table public.leads enable row level security;
alter table public.lead_events enable row level security;
alter table public.marketing_sends enable row level security;
alter table public.marketing_send_recipients enable row level security;
alter table public.tasks enable row level security;
alter table public.workflows enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.integrations enable row level security;
alter table public.audit_log enable row level security;
