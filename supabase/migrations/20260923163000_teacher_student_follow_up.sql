create policy "teacher read own students" on public.students for select to authenticated using (
  public.current_role() = 'teacher'
  and exists (
    select 1
    from public.classes c
    join public.teachers t on t.id = c.teacher_id
    where c.id = students.class_id and t.user_id = (select auth.uid())
  )
);

create policy "teacher read own student accounts" on public.student_account_records for select to authenticated using (
  public.current_role() = 'teacher'
  and exists (
    select 1
    from public.students s
    join public.classes c on c.id = s.class_id
    join public.teachers t on t.id = c.teacher_id
    where s.id = student_account_records.student_id and t.user_id = (select auth.uid())
  )
);

create policy "teacher read own student attendance" on public.student_attendance for select to authenticated using (
  public.current_role() = 'teacher'
  and exists (
    select 1
    from public.classes c
    join public.teachers t on t.id = c.teacher_id
    where c.id = student_attendance.class_id and t.user_id = (select auth.uid())
  )
);
