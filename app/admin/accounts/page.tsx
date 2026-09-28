import { redirect } from "next/navigation";

export default async function AccountsPage() {
  redirect("/admin/reports");
}
