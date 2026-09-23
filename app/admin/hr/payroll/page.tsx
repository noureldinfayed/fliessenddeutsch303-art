import { PayrollCalculator } from "@/components/forms/payroll-calculator";
import { getCurrentUser } from "@/lib/auth";

export default async function PayrollPage() {
  await getCurrentUser("admin");
  return <PayrollCalculator />;
}
