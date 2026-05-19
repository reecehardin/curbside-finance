-- Curbside Finance — database schema
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query).

create extension if not exists "pgcrypto";

create table if not exists public.transactions (
  id                   uuid primary key default gen_random_uuid(),
  type                 text not null check (type in ('income', 'expense')),
  amount               numeric(12, 2) not null check (amount >= 0),
  currency             text not null default 'USD',
  description          text not null,
  category             text,
  customer_name        text,
  occurred_at          timestamptz not null default now(),
  source               text not null default 'manual' check (source in ('tebex', 'manual')),
  status               text not null default 'completed' check (status in ('completed', 'refunded')),
  tebex_transaction_id text,
  raw_payload          jsonb,
  created_at           timestamptz not null default now()
);

-- Webhook idempotency: a Tebex transaction can only be recorded once.
create unique index if not exists transactions_tebex_txn_id_key
  on public.transactions (tebex_transaction_id)
  where tebex_transaction_id is not null;

-- Query helpers for period filtering and sorting.
create index if not exists transactions_occurred_at_idx
  on public.transactions (occurred_at desc);
create index if not exists transactions_type_idx
  on public.transactions (type);

-- Row Level Security ----------------------------------------------------------
-- The dashboard reads as the signed-in user; the Tebex webhook writes with the
-- service role key, which bypasses RLS entirely. So we only need a policy that
-- lets any authenticated user read/write (access is already restricted to one
-- Google account by the app's ALLOWED_EMAIL gate).

alter table public.transactions enable row level security;

drop policy if exists "authenticated full access" on public.transactions;
create policy "authenticated full access"
  on public.transactions
  for all
  to authenticated
  using (true)
  with check (true);
