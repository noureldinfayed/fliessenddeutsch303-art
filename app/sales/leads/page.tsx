import { LeadBoard } from "@/components/forms/lead-board";
import { getCurrentUser } from "@/lib/auth";

export default async function SalesLeadsPage() {
  const { supabase, profile } = await getCurrentUser("sales");
  const { data } = await supabase.from("leads").select("id,full_name,phone,status,created_at,converted_to_student_id,lead_interactions(id,note,created_at,users(full_name))").eq("assigned_to", profile.id).in("file_id", profile.permissions?.assigned_files ?? []).order("created_at", { ascending: false });
  return <LeadBoard initialLeads={(data ?? []) as never} currentUserId={profile.id} />;
}
