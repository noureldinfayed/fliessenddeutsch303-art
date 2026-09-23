import { TreasuryForm } from "@/components/forms/simple-record-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/utils";

export default async function TreasuryPage() {
  const { supabase } = await getCurrentUser("admin");
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase.from("treasury_records").select("*").order("date", { ascending: false });
  const daily = (data ?? []).filter((row) => row.date === today);
  const income = daily.filter((row) => row.type === "income").reduce((sum, row) => sum + Number(row.amount), 0);
  const expense = daily.filter((row) => row.type === "expense").reduce((sum, row) => sum + Number(row.amount), 0);
  const byCategory = (data ?? []).reduce<Record<string, number>>((acc, row) => ({ ...acc, [row.category]: (acc[row.category] ?? 0) + (row.type === "income" ? Number(row.amount) : -Number(row.amount)) }), {});
  return <div className="space-y-6"><TreasuryForm /><div className="grid gap-4 md:grid-cols-3">{[["Total in", income], ["Total out", expense], ["Net", income - expense]].map(([label, value]) => <Card key={label}><CardHeader><CardTitle className="text-sm">{label}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{formatMoney(Number(value))}</CardContent></Card>)}</div><Card><CardHeader><CardTitle>Monthly breakdown by category</CardTitle></CardHeader><CardContent>{Object.entries(byCategory).map(([category, amount]) => <p key={category} className="flex justify-between border-b py-2"><span>{category}</span><span>{formatMoney(amount)}</span></p>)}</CardContent></Card><DataTable rows={(data ?? []) as unknown as Record<string, unknown>[]} columns={[{ key: "date", header: "Date" }, { key: "type", header: "Type" }, { key: "category", header: "Category" }, { key: "amount", header: "Amount" }, { key: "description", header: "Description" }]} /></div>;
}
