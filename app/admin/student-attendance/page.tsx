import { StudentAttendanceForm } from "@/components/forms/attendance-forms";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminStudentAttendancePage() {
  const { supabase, profile } = await getCurrentUser("admin");
  const { data } = await supabase.from("classes").select("id,name,students(id,full_name)").order("name");
  return <StudentAttendanceForm classes={data ?? []} recordedBy={profile.id} />;
}
