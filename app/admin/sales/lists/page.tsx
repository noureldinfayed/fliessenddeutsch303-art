import { ManualLeadSheet } from "@/components/forms/manual-lead-sheet";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminManualSalesListsPage() {
  await getCurrentUser("admin");
  return <ManualLeadSheet />;
}
