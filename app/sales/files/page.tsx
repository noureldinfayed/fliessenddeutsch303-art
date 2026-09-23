import { LeadImporter } from "@/components/forms/lead-importer";
import { DataTable } from "@/components/tables/data-table";
import { getCurrentUser } from "@/lib/auth";

export default async function SalesFilesPage() {
  const { supabase, profile } = await getCurrentUser("sales");
  const { data: files } = await supabase.from("lead_files").select("id,name,upload_date,total_leads").in("id", profile.permissions?.assigned_files ?? []);
  return <div className="space-y-6"><LeadImporter reps={[{ id: profile.id, full_name: profile.full_name }]} /><DataTable rows={(files ?? []) as unknown as Record<string, unknown>[]} columns={[{ key: "name", header: "File" }, { key: "upload_date", header: "Uploaded" }, { key: "total_leads", header: "Total" }]} /></div>;
}
