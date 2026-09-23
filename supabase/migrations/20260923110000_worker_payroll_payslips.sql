alter table public.users add column if not exists payroll_type text not null default 'monthly_salary' check (payroll_type in ('monthly_salary', 'monthly_wage'));
alter table public.users add column if not exists monthly_salary numeric not null default 0;
alter table public.users add column if not exists monthly_wage numeric not null default 0;

create table if not exists public.employee_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type public.adjustment_type not null,
  amount numeric not null,
  reason text not null,
  period_start date not null,
  period_end date not null,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists employee_adjustments_user_id_idx on public.employee_adjustments(user_id, period_start, period_end);

alter table public.employee_adjustments enable row level security;

create policy "admin all employee adjustments" on public.employee_adjustments for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.employee_adjustments to authenticated;
