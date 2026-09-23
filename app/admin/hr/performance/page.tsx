import Link from "next/link";
import { EmployeeEventForm } from "@/components/forms/client-addition-forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { getCurrentUser } from "@/lib/auth";
import { calculatePayslips } from "@/lib/payslip";
import { formatMoney } from "@/lib/utils";

export default async function HrPerformancePage() {
  const { supabase } = await getCurrentUser("admin");
  const monthStartDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthStart = monthStartDate.toISOString();
  const periodStart = monthStart.slice(0, 10);
  const periodEnd = new Date().toISOString().slice(0, 10);
  const [events, users, teachers, interactions, bookings, students, workerFeedback] = await Promise.all([
    supabase.from("employee_events").select("*").order("event_date", { ascending: false }),
    supabase.from("users").select("id,full_name,role").order("full_name"),
    supabase.from("teachers").select("id,name").order("name"),
    supabase.from("lead_interactions").select("created_by,created_at").gte("created_at", monthStart),
    supabase.from("leads").select("assigned_to,status,created_at").eq("status", "booked").gte("created_at", monthStart),
    supabase.from("students").select("id,full_name").order("full_name"),
    supabase.from("student_worker_feedback").select("*").order("created_at", { ascending: false }),
  ]);
  const payslips = await calculatePayslips(supabase, periodStart, periodEnd);
  const eventRows = (events.data ?? []).map((event) => ({
    id: event.id,
    employee: (users.data ?? []).find((user) => user.id === event.user_id)?.full_name ?? (teachers.data ?? []).find((teacher) => teacher.id === event.teacher_id)?.name ?? "",
    type: event.type,
    date: event.event_date,
    amount: event.amount ?? "",
    score: event.score ?? "",
    notes: event.notes,
  }));
  const kpiRows = (users.data ?? []).map((user) => ({
    id: user.id,
    employee: user.full_name,
    role: user.role,
    sales_followups: (interactions.data ?? []).filter((item) => item.created_by === user.id).length,
    sales_bookings: (bookings.data ?? []).filter((item) => item.assigned_to === user.id).length,
    hr_events: (events.data ?? []).filter((item) => item.user_id === user.id).length,
  }));
  const teacherKpiRows = (teachers.data ?? []).map((teacher) => ({
    id: teacher.id,
    employee: teacher.name,
    role: "teacher",
    sales_followups: 0,
    sales_bookings: 0,
    hr_events: (events.data ?? []).filter((item) => item.teacher_id === teacher.id).length,
  }));
  const studentWorkerFeedbackRows = (workerFeedback.data ?? []).map((item) => ({
    id: item.id,
    student: (students.data ?? []).find((student) => student.id === item.student_id)?.full_name ?? item.student_id,
    worker: item.target_role === "teacher"
      ? (teachers.data ?? []).find((teacher) => teacher.id === item.target_teacher_id)?.name ?? "Teacher"
      : (users.data ?? []).find((user) => user.id === item.target_user_id)?.full_name ?? "Reception",
    role: item.target_role,
    comment: item.comment,
    date: String(item.created_at).slice(0, 10),
  }));
  return (
    <div className="space-y-6">
      <EmployeeEventForm users={users.data ?? []} teachers={teachers.data ?? []} />
      <Card>
        <CardHeader><CardTitle>Payslip print - current month</CardTitle></CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-muted">
              <tr>
                {["Employee", "Role", "Pay type", "Hours", "Sessions", "Base", "Bonuses", "Deductions", "Total", "Print"].map((header) => <th key={header} className="px-4 py-3 text-left">{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {payslips.map((row) => (
                <tr key={`${row.kind}-${row.id}`} className="border-t">
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3">{row.role}</td>
                  <td className="px-4 py-3">{row.payType}</td>
                  <td className="px-4 py-3">{row.hours.toFixed(2)}</td>
                  <td className="px-4 py-3">{row.sessions}</td>
                  <td className="px-4 py-3">{formatMoney(row.basePay)}</td>
                  <td className="px-4 py-3">{formatMoney(row.bonuses)}</td>
                  <td className="px-4 py-3">{formatMoney(row.deductions)}</td>
                  <td className="px-4 py-3 font-semibold">{formatMoney(row.net)}</td>
                  <td className="px-4 py-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/hr/performance/payslip/${row.kind}/${row.id}?start=${periodStart}&end=${periodEnd}`}>Print payslip</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Employee KPIs this month</CardTitle></CardHeader><CardContent><DataTable rows={[...kpiRows, ...teacherKpiRows]} columns={[{ key: "employee", header: "Employee" }, { key: "role", header: "Role" }, { key: "sales_followups", header: "Sales follow-ups" }, { key: "sales_bookings", header: "Sales bookings" }, { key: "hr_events", header: "HR notes" }]} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Student comments about staff - admin only</CardTitle></CardHeader><CardContent><DataTable rows={studentWorkerFeedbackRows} columns={[{ key: "student", header: "Student" }, { key: "worker", header: "Worker" }, { key: "role", header: "Role" }, { key: "comment", header: "Comment" }, { key: "date", header: "Date" }]} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Vacations, penalties, performance notes</CardTitle></CardHeader><CardContent><DataTable rows={eventRows} columns={[{ key: "employee", header: "Employee" }, { key: "type", header: "Type" }, { key: "date", header: "Date" }, { key: "amount", header: "Amount" }, { key: "score", header: "Score" }, { key: "notes", header: "Notes" }]} /></CardContent></Card>
    </div>
  );
}
