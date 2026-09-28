alter table public.leads
  add column if not exists crm_data jsonb not null default '{}'::jsonb;

create index if not exists leads_crm_data_gin on public.leads using gin (crm_data);
