create table if not exists public.client_brand_brains (
  id uuid primary key default gen_random_uuid(),
  dealership_id uuid not null unique references public.dealerships(id) on delete cascade,
  tone_english text not null default 'friendly, direct, and helpful',
  tone_spanish text not null default 'respectful, clear, family-oriented, and natural for local Spanish-speaking buyers',
  approved_phrases text[] not null default '{}'::text[],
  banned_phrases text[] not null default array[
    'guaranteed approval',
    'no credit check',
    '100% approved',
    'drive away free',
    '$0 down'
  ],
  down_payment_rules text not null default 'Advertise approved down payment amounts only. If an amount is missing or unapproved, use safe language such as Low Down Payment or Down Payment Options Available.',
  finance_disclaimer text not null default 'WAC. Subject to approval of credit. Tax, title, license, and dealer fees may be additional.',
  spanish_guidance text not null default 'Prefer adaptation over literal translation. Keep wording clear, respectful, and easy to understand.',
  target_audience_notes text,
  objection_handling_notes text,
  platform_rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.client_brand_brains enable row level security;

create index if not exists client_brand_brains_dealership_id_idx
  on public.client_brand_brains(dealership_id);
