-- Widen VARCHAR(50) columns in the inspections table to TEXT.
-- Several text fields were created with a 50-character limit, causing
-- "value too long for type character varying(50)" errors when a full
-- intake form is submitted (e.g. long purchased_from or inspector_name).
-- The dependent view must be dropped and recreated around the ALTER.
drop view if exists public.inspection_vehicle_source;

alter table public.inspections
  alter column inspector_name  type text,
  alter column purchased_from  type text,
  alter column color           type text,
  alter column make            type text,
  alter column model           type text,
  alter column body            type text,
  alter column transmission    type text,
  alter column paid_status     type text,
  alter column year            type text,
  alter column miles           type text,
  alter column inspection_date type text;

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
