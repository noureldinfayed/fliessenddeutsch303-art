import { ClassManager } from "@/components/forms/class-manager";
import { getCurrentUser } from "@/lib/auth";
import { refreshClassSessionProgress } from "@/lib/class-progress";

export default async function ClassesPage() {
  const { supabase } = await getCurrentUser("admin");
  const [classes, teachers] = await Promise.all([
    supabase.from("classes").select("id,name,level,learning_mode,schedule,capacity,teacher_id,total_sessions,sessions_done,last_session_completed_date,class_status,current_chapter,teachers(name),students(id,full_name,phone,email,level,learning_mode,status)").order("created_at", { ascending: false }),
    supabase.from("teachers").select("id,name").order("name"),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const classesWithProgress = await Promise.all((classes.data ?? []).map(async (row) => ({ ...row, ...(await refreshClassSessionProgress(supabase, row.id, today)) })));
  return <ClassManager initialClasses={classesWithProgress as never} teachers={teachers.data ?? []} />;
}
