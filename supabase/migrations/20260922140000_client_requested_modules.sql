do $$ begin
  create type public.account_payment_status as enum ('paid', 'scheduled', 'due', 'overdue');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.exam_type as enum ('placement', 'osd', 'internal');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.feedback_source as enum ('student', 'teacher');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.employee_event_type as enum ('vacation', 'penalty', 'performance_note');
exception when duplicate_object then null;
end $$;

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.students add column if not exists branch_id uuid references public.branches(id) on delete set null;
alter table public.classes add column if not exists branch_id uuid references public.branches(id) on delete set null;
alter table public.treasury_records add column if not exists branch_id uuid references public.branches(id) on delete set null;

create table if not exists public.student_account_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  teacher_id uuid references public.teachers(id) on delete set null,
  received_by uuid references public.users(id) on delete set null,
  amount numeric not null default 0,
  due_date date,
  paid_at timestamptz,
  status public.account_payment_status not null default 'scheduled',
  notes text,
  receipt_no text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.exam_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete set null,
  exam_type public.exam_type not null default 'placement',
  scheduled_at timestamptz not null,
  level_result text,
  score_percent numeric,
  result_comment text,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.feedback_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid references public.teachers(id) on delete set null,
  source public.feedback_source not null,
  rating integer check (rating between 1 and 5),
  comment text not null,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.employee_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  teacher_id uuid references public.teachers(id) on delete cascade,
  type public.employee_event_type not null,
  event_date date not null,
  amount numeric,
  score numeric,
  notes text not null,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  check (user_id is not null or teacher_id is not null)
);

create index if not exists student_account_records_student_id_idx on public.student_account_records(student_id);
create index if not exists student_account_records_due_date_idx on public.student_account_records(due_date, status);
create index if not exists exam_records_student_id_idx on public.exam_records(student_id, scheduled_at);
create index if not exists feedback_records_student_id_idx on public.feedback_records(student_id, created_at);
create index if not exists employee_events_event_date_idx on public.employee_events(event_date, type);

alter table public.branches enable row level security;
alter table public.student_account_records enable row level security;
alter table public.exam_records enable row level security;
alter table public.feedback_records enable row level security;
alter table public.employee_events enable row level security;

create policy "admin all branches" on public.branches for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "staff read branches" on public.branches for select to authenticated using (public.current_role() in ('reception', 'sales', 'teacher'));

create policy "admin all student accounts" on public.student_account_records for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "reception write student accounts" on public.student_account_records for all to authenticated using (public.current_role() = 'reception') with check (public.current_role() = 'reception');

create policy "admin all exams" on public.exam_records for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "reception write exams" on public.exam_records for all to authenticated using (public.current_role() = 'reception') with check (public.current_role() = 'reception');
create policy "teacher read own student exams" on public.exam_records for select to authenticated using (
  public.current_role() = 'teacher'
  and exists (
    select 1
    from public.students s
    join public.classes c on c.id = s.class_id
    join public.teachers t on t.id = c.teacher_id
    where s.id = exam_records.student_id and t.user_id = (select auth.uid())
  )
);

create policy "admin all feedback" on public.feedback_records for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "reception write feedback" on public.feedback_records for all to authenticated using (public.current_role() = 'reception') with check (public.current_role() = 'reception');
create policy "teacher write own feedback" on public.feedback_records for all to authenticated using (
  public.current_role() = 'teacher'
  and teacher_id in (select id from public.teachers where user_id = (select auth.uid()))
) with check (
  public.current_role() = 'teacher'
  and teacher_id in (select id from public.teachers where user_id = (select auth.uid()))
);

create policy "admin all employee events" on public.employee_events for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.branches to authenticated;
grant select, insert, update, delete on public.student_account_records to authenticated;
grant select, insert, update, delete on public.exam_records to authenticated;
grant select, insert, update, delete on public.feedback_records to authenticated;
grant select, insert, update, delete on public.employee_events to authenticated;
