import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminSalesPage() {
  const { supabase } = await getCurrentUser("admin");
  const weekStart = new Date(Date.now() - 6 * 86400000).toISOString();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const [leads, reps, interactions, bookings] = await Promise.all([
    supabase.from("leads").select("id,full_name,phone,status,created_at,users!leads_assigned_to_fkey(full_name),lead_files(name)").order("created_at", { ascending: false }),
    supabase.from("users").select("id,full_name").eq("role", "sales"),
    supabase.from("lead_interactions").select("created_by,created_at").gte("created_at", weekStart),
    supabase.from("leads").select("assigned_to,created_at,status").eq("status", "booked").gte("created_at", monthStart),
  ]);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">{(reps.data ?? []).map((rep) => <Card key={rep.id}><CardHeader><CardTitle className="text-base">{rep.full_name}</CardTitle></CardHeader><CardContent className="text-sm"><p>{interactions.data?.filter((i) => i.created_by === rep.id).length ?? 0} interactions this week</p><p>{bookings.data?.filter((b) => b.assigned_to === rep.id).length ?? 0} bookings this month</p></CardContent></Card>)}</div>
      <DataTable rows={(leads.data ?? []) as unknown as Record<string, unknown>[]} columns={[{ key: "full_name", header: "Lead" }, { key: "phone", header: "Phone" }, { key: "status", header: "Status" }, { key: "created_at", header: "Created" }]} />
    </div>
  );
}
