import { ClassManager } from "@/components/forms/class-manager";
import { getCurrentUser } from "@/lib/auth";

export default async function ClassesPage() {
  const { supabase } = await getCurrentUser("admin");
  const [classes, teachers] = await Promise.all([
    supabase.from("classes").select("id,name,level,learning_mode,schedule,capacity,teacher_id,teachers(name),students(id,full_name,phone,email,level,learning_mode,status)").order("created_at", { ascending: false }),
    supabase.from("teachers").select("id,name").order("name"),
  ]);
  return <ClassManager initialClasses={(classes.data ?? []) as never} teachers={teachers.data ?? []} />;
}
