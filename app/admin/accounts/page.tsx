import Link from "next/link";
import { AccountRecordForm } from "@/components/forms/client-addition-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/utils";

function monthStart() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
}

export default async function AccountsPage() {
  const { supabase } = await getCurrentUser("admin");
  const today = new Date().toISOString().slice(0, 10);
  const [records, students, classes, teachers, users, treasury] = await Promise.all([
    supabase.from("student_account_records").select("*").order("created_at", { ascending: false }),
    supabase.from("students").select("id,full_name,total_price,amount_paid,class_id"),
    supabase.from("classes").select("id,name,teacher_id"),
    supabase.from("teachers").select("id,name"),
    supabase.from("users").select("id,full_name"),
    supabase.from("treasury_records").select("type,amount,category,date"),
  ]);

  const allRecords = records.data ?? [];
  const allTreasury = treasury.data ?? [];
  const dailyIncome = allTreasury.filter((row) => row.type === "income" && row.date === today).reduce((sum, row) => sum + Number(row.amount), 0);
  const dailyExpense = allTreasury.filter((row) => row.type === "expense" && row.date === today).reduce((sum, row) => sum + Number(row.amount), 0);
  const monthlyIncome = allTreasury.filter((row) => row.type === "income" && row.date >= monthStart()).reduce((sum, row) => sum + Number(row.amount), 0);
  const monthlyExpense = allTreasury.filter((row) => row.type === "expense" && row.date >= monthStart()).reduce((sum, row) => sum + Number(row.amount), 0);

  const classRows = (classes.data ?? []).map((klass) => {
    const classAccounts = allRecords.filter((record) => record.class_id === klass.id);
    const classIncome = classAccounts.filter((record) => record.status === "paid").reduce((sum, record) => sum + Number(record.amount), 0);
    const scheduled = classAccounts.filter((record) => record.status !== "paid").reduce((sum, record) => sum + Number(record.amount), 0);
    return { id: klass.id, course: klass.name, paid: formatMoney(classIncome), scheduled: formatMoney(scheduled), records: classAccounts.length };
  });

  const displayRows = allRecords.map((record) => ({
    id: record.id,
    student_id: record.student_id,
    student: (students.data ?? []).find((student) => student.id === record.student_id)?.full_name ?? record.student_id,
    amount: formatMoney(Number(record.amount)),
    received_by: (users.data ?? []).find((user) => user.id === record.received_by)?.full_name ?? "",
    lecturer: (teachers.data ?? []).find((teacher) => teacher.id === record.teacher_id)?.name ?? "",
    course: (classes.data ?? []).find((klass) => klass.id === record.class_id)?.name ?? "",
    due_date: record.due_date ?? "",
    status: record.status,
    receipt_no: record.receipt_no ?? "",
    notes: record.notes ?? "",
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-sm">Today income</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{formatMoney(dailyIncome)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Today expenses</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{formatMoney(dailyExpense)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Monthly income</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{formatMoney(monthlyIncome)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Monthly profit</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{formatMoney(monthlyIncome - monthlyExpense)}</CardContent></Card>
      </div>

      <AccountRecordForm students={students.data ?? []} classes={classes.data ?? []} teachers={teachers.data ?? []} users={users.data ?? []} />

      <Card>
        <CardHeader><CardTitle>Per-course accounts</CardTitle></CardHeader>
        <CardContent><DataTable rows={classRows} columns={[{ key: "course", header: "Course" }, { key: "paid", header: "Paid" }, { key: "scheduled", header: "Scheduled / unpaid" }, { key: "records", header: "Records" }]} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Account records</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            rows={displayRows}
            columns={[
              { key: "student", header: "Student" },
              { key: "amount", header: "Amount" },
              { key: "received_by", header: "Received by" },
              { key: "lecturer", header: "Lecturer" },
              { key: "course", header: "Course" },
              { key: "due_date", header: "Will pay on" },
              { key: "status", header: "Status" },
              { key: "receipt_no", header: "Receipt" },
              { key: "notes", header: "Notes" },
            ]}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {displayRows.slice(0, 6).map((row) => <Button key={row.id} asChild variant="outline" size="sm"><Link href={`/receipts/student/${row.student_id}`}>Print receipt {row.receipt_no}</Link></Button>)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
