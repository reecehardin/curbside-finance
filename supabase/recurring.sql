-- Recurring monthly expenses — run in the Supabase SQL editor (once).
-- Adds the recurring_expenses table, links transactions to it, and seeds
-- the current subscription list (seed only runs if the table is empty).

create table if not exists public.recurring_expenses (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  amount            numeric(12, 2) not null check (amount > 0),
  original_amount   numeric(12, 2),
  original_currency text,
  category          text,
  billing_day       int not null check (billing_day between 1 and 31),
  next_billing_date date not null,
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);

alter table public.recurring_expenses enable row level security;

drop policy if exists "authenticated full access" on public.recurring_expenses;
create policy "authenticated full access"
  on public.recurring_expenses
  for all
  to authenticated
  using (true)
  with check (true);

-- Link posted charges back to their subscription. Deleting a subscription
-- keeps its historical expenses (FK set null).
alter table public.transactions
  add column if not exists recurring_expense_id uuid
    references public.recurring_expenses(id) on delete set null,
  add column if not exists billing_month date;

-- Allow the new source value.
alter table public.transactions drop constraint if exists transactions_source_check;
alter table public.transactions add constraint transactions_source_check
  check (source in ('tebex', 'manual', 'recurring'));

-- Idempotency: one posted charge per subscription per calendar month.
create unique index if not exists transactions_recurring_month_key
  on public.transactions (recurring_expense_id, billing_month)
  where recurring_expense_id is not null;

-- Seed (only when the table is empty). The two past-dated rows (Jun 3, Jun 9)
-- are this month's backfill: the first run of /api/recurring/post posts them
-- immediately and advances them to July.
insert into public.recurring_expenses
  (name, amount, original_amount, original_currency, category, billing_day, next_billing_date)
select * from (values
  ('Multiplayer Jobs Bundle #1',        65.08::numeric, null::numeric, null,  'Assets & Scripts', 9,  date '2026-06-09'),
  ('1 Month Subscription – Vehicles',   30.00::numeric, null::numeric, null,  'Assets & Scripts', 3,  date '2026-06-03'),
  ('JG+ Subscription',                  34.00::numeric, null::numeric, null,  'Assets & Scripts', 17, date '2026-06-17'),
  ('50 Weapon Pack HQ Chromium',        29.00::numeric, null::numeric, null,  'Assets & Scripts', 19, date '2026-06-19'),
  ('FiveM Beyond',                      30.00::numeric, null::numeric, null,  'Assets & Scripts', 20, date '2026-06-20'),
  ('Element Club Platinum',             50.00::numeric, null::numeric, null,  'Server Hosting',   21, date '2026-06-21'),
  ('CODEWAVE Subscription',             27.00::numeric, 20.00::numeric, 'GBP', 'Assets & Scripts', 22, date '2026-06-22'),
  ('Server Hosting',                    70.00::numeric, null::numeric, null,  'Server Hosting',   22, date '2026-06-22'),
  ('EVP Police and EMS Vehicle Pack',   19.99::numeric, null::numeric, null,  'Assets & Scripts', 25, date '2026-06-25'),
  ('CVP Civilian Vehicle Pack',         14.99::numeric, null::numeric, null,  'Assets & Scripts', 25, date '2026-06-25'),
  ('Gold – 1 month',                    23.00::numeric, 20.00::numeric, 'EUR', 'Assets & Scripts', 27, date '2026-06-27')
) as seed(name, amount, original_amount, original_currency, category, billing_day, next_billing_date)
where not exists (select 1 from public.recurring_expenses);
