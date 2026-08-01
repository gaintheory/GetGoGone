-- Link a GetGoGone dealership to its AutoDoss dealer record.
--
-- Why: `clientId` was being used as two different things. The client switcher
-- gets its ids from GetGoGone's own `dealerships` table (/api/agency/clients),
-- but /api/inventory passed that same id straight to the AutoDoss Data API as
-- an AutoDoss dealer id. Those are unrelated UUID namespaces, so selecting a
-- client asked AutoDoss for a dealer that does not exist there — inventory came
-- back empty and the UI silently fell back to demo vehicles.
--
-- This column is the explicit mapping between the two namespaces. Nullable on
-- purpose: a dealership with no AutoDoss counterpart is a valid state, and the
-- API surfaces that as an actionable error rather than guessing.

alter table public.dealerships
  add column if not exists autodoss_dealer_id text;

comment on column public.dealerships.autodoss_dealer_id is
  'Dealer id in the AutoDoss Data API. Null means this dealership is not linked to AutoDoss yet.';

create unique index if not exists dealerships_autodoss_dealer_id_key
  on public.dealerships (autodoss_dealer_id)
  where autodoss_dealer_id is not null;
