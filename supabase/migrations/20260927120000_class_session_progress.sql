alter table public.classes add column if not exists total_sessions integer not null default 12 check (total_sessions >= 0);
alter table public.classes add column if not exists sessions_done integer not null default 0 check (sessions_done >= 0);
alter table public.classes add column if not exists last_session_completed_date date;
alter table public.classes add column if not exists class_status text not null default 'not_started' check (class_status in ('not_started', 'started', 'finished'));
alter table public.classes add column if not exists current_chapter text not null default '';
alter table public.exam_records add column if not exists booking_status text not null default 'not_booked' check (booking_status in ('booked', 'not_booked'));
alter table public.exam_records add column if not exists booked_class_id uuid references public.classes(id) on delete set null;
alter table public.students add column if not exists freeze_start_date date;
alter table public.students add column if not exists freeze_months integer not null default 0 check (freeze_months between 0 and 3);
alter table public.students add column if not exists freeze_end_date date;
alter table public.students add column if not exists level_completed_stopped boolean not null default false;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  actor_name text not null,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
drop policy if exists "Admins can read audit logs" on public.audit_logs;
create policy "Admins can read audit logs" on public.audit_logs for select using (public.current_role() = 'admin');
drop policy if exists "Authenticated users can write audit logs" on public.audit_logs;
create policy "Authenticated users can write audit logs" on public.audit_logs for insert with check (auth.uid() is not null);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);

create table if not exists public.textbook_inventory (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  level text,
  edition text,
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  quantity_needed integer not null default 0 check (quantity_needed >= 0),
  quantity_ordered integer not null default 0 check (quantity_ordered >= 0),
  ordered_at date,
  expected_delivery_date date,
  supplier text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.textbook_inventory enable row level security;
drop policy if exists "Admins can manage textbook inventory" on public.textbook_inventory;
create policy "Admins can manage textbook inventory" on public.textbook_inventory for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create index if not exists classes_session_progress_idx on public.classes(sessions_done, total_sessions);
