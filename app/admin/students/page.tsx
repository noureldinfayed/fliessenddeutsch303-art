import { StudentManager } from "@/components/forms/student-manager";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminStudentsPage() {
  const { supabase } = await getCurrentUser("admin");
  const [students, classes] = await Promise.all([
    supabase.from("students").select("id,full_name,phone,email,level,tags,class_id,learning_mode,status,total_price,amount_paid,payment_due_date,payment_comment,freeze_start_date,freeze_months,freeze_end_date,level_completed_stopped,enrolled_at,created_at,classes(name,teachers(name))").order("created_at", { ascending: false }),
    supabase.from("classes").select("id,name").order("name"),
  ]);
  return <StudentManager initialStudents={(students.data ?? []) as never} classes={classes.data ?? []} />;
}
