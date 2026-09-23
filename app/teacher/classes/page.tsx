import { DataTable } from "@/components/tables/data-table";
import { getCurrentUser } from "@/lib/auth";

export default async function TeacherClassesPage() {
  const { supabase, profile } = await getCurrentUser("teacher");
  const { data: teacher } = await supabase.from("teachers").select("id").eq("user_id", profile.id).single();
  const { data } = await supabase.from("classes").select("id,name,schedule,capacity").eq("teacher_id", teacher?.id ?? "");
  return <DataTable rows={(data ?? []) as unknown as Record<string, unknown>[]} columns={[{ key: "name", header: "Name" }, { key: "schedule", header: "Schedule" }, { key: "capacity", header: "Capacity" }]} />;
}
