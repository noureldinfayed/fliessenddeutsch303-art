import { StudentAttendanceForm } from "@/components/forms/attendance-forms";
import { getCurrentUser } from "@/lib/auth";

export default async function StudentAttendancePage() {
  const { supabase, profile } = await getCurrentUser("reception");
  const { data } = await supabase.from("classes").select("id,name,students(id,full_name)").order("name");
  return <StudentAttendanceForm classes={data ?? []} recordedBy={profile.id} />;
}
