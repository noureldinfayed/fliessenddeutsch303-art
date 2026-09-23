create table if not exists public.student_worker_feedback (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  target_user_id uuid references public.users(id) on delete set null,
  target_teacher_id uuid references public.teachers(id) on delete set null,
  target_role text not null check (target_role in ('teacher', 'reception')),
  comment text not null,
  created_at timestamptz not null default now(),
  check (target_user_id is not null or target_teacher_id is not null)
);

create index if not exists student_worker_feedback_student_id_idx on public.student_worker_feedback(student_id, created_at);
create index if not exists student_worker_feedback_target_user_id_idx on public.student_worker_feedback(target_user_id, created_at);
create index if not exists student_worker_feedback_target_teacher_id_idx on public.student_worker_feedback(target_teacher_id, created_at);

alter table public.student_worker_feedback enable row level security;

create policy "admin all student worker feedback" on public.student_worker_feedback for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.student_worker_feedback to authenticated;
