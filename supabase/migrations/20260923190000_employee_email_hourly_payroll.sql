alter table public.users add column if not exists email text;
alter table public.users add column if not exists hourly_rate numeric not null default 0;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'users'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%payroll_type%'
  loop
    execute format('alter table public.users drop constraint if exists %I', constraint_name);
  end loop;
end $$;

alter table public.users
  add constraint users_payroll_type_check
  check (payroll_type in ('monthly_salary', 'monthly_wage', 'hourly'));

create table if not exists public.employee_attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  check_in time,
  check_out time,
  notes text,
  recorded_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamp with time zone default now(),
  unique(user_id, date)
);

alter table public.employee_attendance enable row level security;

create policy "admin all employee attendance" on public.employee_attendance
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "reception write employee attendance" on public.employee_attendance
for all to authenticated
using (public.current_role() = 'reception')
with check (public.current_role() = 'reception');

create policy "own employee attendance read" on public.employee_attendance
for select to authenticated
using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.employee_attendance to authenticated;
