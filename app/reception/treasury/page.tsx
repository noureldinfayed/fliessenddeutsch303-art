import { TreasuryForm } from "@/components/forms/simple-record-forms";
import { getCurrentUser } from "@/lib/auth";

export default async function ReceptionTreasuryPage() {
  await getCurrentUser("reception");
  return <div className="max-w-5xl"><TreasuryForm /></div>;
}
