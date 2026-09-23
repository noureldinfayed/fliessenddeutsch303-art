create type public.user_role as enum ('admin', 'reception', 'sales', 'teacher');
create type public.pay_type as enum ('hourly', 'per_session', 'fixed');
create type public.adjustment_type as enum ('bonus', 'deduction');
create type public.student_status as enum ('active', 'inactive', 'graduated');
create type public.attendance_status as enum ('present', 'absent', 'late', 'excused');
create type public.lead_status as enum ('new', 'interested', 'thinking', 'no_answer', 'booked', 'not_interested');
create type public.treasury_type as enum ('income', 'expense');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.user_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  permissions jsonb not null default '{}'::jsonb
);

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  name text not null,
  phone text,
  pay_type public.pay_type not null,
  base_rate numeric not null default 0,
  created_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.teachers(id) on delete set null,
  level text,
  learning_mode text not null default 'offline' check (learning_mode in ('online', 'offline')),
  schedule text not null,
  capacity integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  level text,
  tags text[] not null default '{}',
  class_id uuid references public.classes(id) on delete set null,
  learning_mode text not null default 'offline' check (learning_mode in ('online', 'offline')),
  total_price numeric not null default 0,
  amount_paid numeric not null default 0,
  payment_due_date date,
  payment_comment text,
  status public.student_status not null default 'active',
  enrolled_at timestamptz default now(),
  created_at timestamptz not null default now()
);

create table public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  date date not null,
  check_in time,
  check_out time,
  sessions_count integer not null default 0,
  notes text,
  recorded_by uuid references public.users(id),
  unique (teacher_id, date)
);

create table public.teacher_adjustments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  type public.adjustment_type not null,
  amount numeric not null,
  reason text not null,
  period_start date not null,
  period_end date not null,
  created_by uuid references public.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.student_attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  date date not null,
  status public.attendance_status not null,
  recorded_by uuid references public.users(id),
  unique (student_id, class_id, date)
);

create table public.lead_files (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  uploaded_by uuid references public.users(id),
  upload_date timestamptz not null default now(),
  total_leads integer not null default 0
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  source text,
  file_id uuid references public.lead_files(id) on delete cascade,
  status public.lead_status not null default 'new',
  assigned_to uuid references public.users(id),
  converted_to_student_id uuid references public.students(id),
  created_at timestamptz not null default now()
);

create table public.lead_interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  note text not null,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table public.treasury_records (
  id uuid primary key default gen_random_uuid(),
  type public.treasury_type not null,
  amount numeric not null,
  description text,
  category text not null,
  date date not null,
  created_by uuid references public.users(id) default auth.uid()
);

create index on public.leads(file_id, assigned_to);
create index on public.lead_interactions(lead_id, created_at);
create index on public.student_attendance(class_id, date);
create index on public.teacher_attendance(teacher_id, date);

alter table public.users enable row level security;
alter table public.teachers enable row level security;
alter table public.teacher_attendance enable row level security;
alter table public.teacher_adjustments enable row level security;
alter table public.students enable row level security;
alter table public.classes enable row level security;
alter table public.student_attendance enable row level security;
alter table public.leads enable row level security;
alter table public.lead_files enable row level security;
alter table public.lead_interactions enable row level security;
alter table public.treasury_records enable row level security;

create function public.current_role() returns public.user_role language sql stable as $$
  select role from public.users where id = (select auth.uid()) and is_active = true
$$;

create function public.current_permissions() returns jsonb language sql stable as $$
  select permissions from public.users where id = (select auth.uid()) and is_active = true
$$;

create function public.is_admin() returns boolean language sql stable as $$ select public.current_role() = 'admin' $$;

create policy "admin all users" on public.users for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "own user read" on public.users for select to authenticated using (id = (select auth.uid()));

create policy "admin all teachers" on public.teachers for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "reception read teachers" on public.teachers for select to authenticated using (public.current_role() = 'reception');
create policy "teacher read own teacher row" on public.teachers for select to authenticated using (user_id = (select auth.uid()));

create policy "admin all classes" on public.classes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "reception read classes" on public.classes for select to authenticated using (public.current_role() = 'reception');
create policy "teacher read own classes" on public.classes for select to authenticated using (teacher_id in (select id from public.teachers where user_id = (select auth.uid())));

create policy "admin all students" on public.students for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "reception read write students" on public.students for all to authenticated using (public.current_role() = 'reception') with check (public.current_role() = 'reception');
create policy "sales convert students" on public.students for insert to authenticated with check (public.current_role() = 'sales');

create policy "admin all student attendance" on public.student_attendance for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "reception write student attendance" on public.student_attendance for all to authenticated using (public.current_role() = 'reception') with check (public.current_role() = 'reception');

create policy "admin all teacher attendance" on public.teacher_attendance for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "reception write teacher attendance" on public.teacher_attendance for all to authenticated using (public.current_role() = 'reception') with check (public.current_role() = 'reception');
create policy "teacher read own attendance" on public.teacher_attendance for select to authenticated using (teacher_id in (select id from public.teachers where user_id = (select auth.uid())));

create policy "admin all adjustments" on public.teacher_adjustments for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin all lead files" on public.lead_files for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "sales assigned lead files" on public.lead_files for select to authenticated using (public.current_role() = 'sales' and id::text in (select jsonb_array_elements_text(coalesce(public.current_permissions()->'assigned_files', '[]'::jsonb))));
create policy "sales insert lead files" on public.lead_files for insert to authenticated with check (public.current_role() = 'sales' and uploaded_by = (select auth.uid()));

create policy "admin all leads" on public.leads for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "sales assigned leads" on public.leads for all to authenticated using (public.current_role() = 'sales' and assigned_to = (select auth.uid()) and file_id::text in (select jsonb_array_elements_text(coalesce(public.current_permissions()->'assigned_files', '[]'::jsonb)))) with check (public.current_role() = 'sales' and assigned_to = (select auth.uid()));
create policy "reception assigned sales read" on public.leads for select to authenticated using (public.current_role() = 'reception' and coalesce((public.current_permissions()->>'sales_access')::boolean, false) and assigned_to = (select auth.uid()));

create policy "admin all interactions" on public.lead_interactions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "sales lead interactions" on public.lead_interactions for select to authenticated using (exists (select 1 from public.leads l where l.id = lead_id and l.assigned_to = (select auth.uid())));
create policy "sales insert interactions" on public.lead_interactions for insert to authenticated with check (public.current_role() = 'sales' and created_by = (select auth.uid()));

create policy "admin all treasury" on public.treasury_records for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
