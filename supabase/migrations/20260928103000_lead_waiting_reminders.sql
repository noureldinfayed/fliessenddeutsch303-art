alter type public.lead_status add value if not exists 'waiting';
alter table public.leads add column if not exists tags text[] not null default '{}';
create index if not exists leads_tags_gin on public.leads using gin (tags);

create table if not exists public.lead_reminders (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  due_at date not null,
  note text not null default '',
  created_by uuid references public.users(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.lead_reminders enable row level security;
create policy "lead reminder recipients can read" on public.lead_reminders for select to authenticated using (user_id = auth.uid() or public.current_role() = 'admin');
create policy "admin and sales can create lead reminders" on public.lead_reminders for insert to authenticated with check (created_by = auth.uid() and public.current_role() in ('admin', 'sales'));
create policy "recipients can mark reminders read" on public.lead_reminders for update to authenticated using (user_id = auth.uid() or public.current_role() = 'admin') with check (user_id = auth.uid() or public.current_role() = 'admin');
create index if not exists lead_reminders_recipient_due_idx on public.lead_reminders(user_id, due_at, read_at);
