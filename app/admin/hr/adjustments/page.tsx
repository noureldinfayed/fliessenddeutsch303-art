import { AdjustmentForm } from "@/components/forms/simple-record-forms";
import { DataTable } from "@/components/tables/data-table";
import { getCurrentUser } from "@/lib/auth";

export default async function AdjustmentsPage() {
  const { supabase } = await getCurrentUser("admin");
  const [teachers, adjustments] = await Promise.all([
    supabase.from("teachers").select("id,name").order("name"),
    supabase.from("teacher_adjustments").select("id,type,amount,reason,period_start,period_end,teachers(name)").order("created_at", { ascending: false }),
  ]);
  return <div className="space-y-6"><AdjustmentForm teachers={teachers.data ?? []} /><DataTable rows={(adjustments.data ?? []) as unknown as Record<string, unknown>[]} columns={[{ key: "type", header: "Type" }, { key: "amount", header: "Amount" }, { key: "reason", header: "Reason" }, { key: "period_start", header: "Start" }, { key: "period_end", header: "End" }]} /></div>;
}
