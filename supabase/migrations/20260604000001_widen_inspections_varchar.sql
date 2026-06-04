-- Widen VARCHAR(50) columns in the inspections table to TEXT.
-- Several text fields were created with a 50-character limit, causing
-- "value too long for type character varying(50)" errors when a full
-- intake form is submitted (e.g. long purchased_from or inspector_name).
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
