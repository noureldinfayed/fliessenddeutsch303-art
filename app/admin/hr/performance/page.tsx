import Link from "next/link";
import { EmployeeEventForm } from "@/components/forms/client-addition-forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentLanguage } from "@/lib/i18n-server";
import type { Lang } from "@/lib/i18n";
import { calculatePayslips } from "@/lib/payslip";
import { formatMoney } from "@/lib/utils";

function translateValue(value: string, lang: Lang) {
  if (lang !== "ar") return value;
  return ({
    admin: "مدير",
    reception: "استقبال",
    sales: "مبيعات",
    teacher: "مدرس",
    hourly: "بالساعة",
    per_session: "بالحصة",
    monthly_salary: "راتب شهري",
    monthly_wage: "أجر شهري",
    vacation: "إجازة",
    penalty: "جزاء",
    performance_note: "ملاحظة أداء",
  } as Record<string, string>)[value] ?? value;
}

export default async function HrPerformancePage() {
  const { supabase } = await getCurrentUser("admin");
  const lang = await getCurrentLanguage();
  const labels = lang === "ar" ? {
    payslip: "طباعة كشوف المرتبات - الشهر الحالي", employee: "الموظف", role: "الوظيفة", payType: "نوع الأجر", hours: "الساعات", sessions: "الحصص", base: "الأساسي", bonuses: "المكافآت", deductions: "الخصومات", total: "الإجمالي", print: "طباعة كشف المرتب", kpis: "مؤشرات أداء الموظفين هذا الشهر", followups: "متابعات المبيعات", bookings: "حجوزات المبيعات", hrNotes: "ملاحظات الموارد البشرية", feedback: "تعليقات الطلاب على الموظفين - للإدارة فقط", student: "الطالب", worker: "الموظف", comment: "التعليق", date: "التاريخ", events: "الإجازات والجزاءات وملاحظات الأداء", type: "النوع", amount: "المبلغ", score: "الدرجة", notes: "الملاحظات", table: { search: "بحث...", previous: "السابق", next: "التالي" }, empty: "لا توجد سجلات بعد.",
  } : {
    payslip: "Payslip print - current month", employee: "Employee", role: "Role", payType: "Pay type", hours: "Hours", sessions: "Sessions", base: "Base", bonuses: "Bonuses", deductions: "Deductions", total: "Total", print: "Print payslip", kpis: "Employee KPIs this month", followups: "Sales follow-ups", bookings: "Sales bookings", hrNotes: "HR notes", feedback: "Student comments about staff - admin only", student: "Student", worker: "Worker", comment: "Comment", date: "Date", events: "Vacations, penalties, performance notes", type: "Type", amount: "Amount", score: "Score", notes: "Notes", table: { search: "Search...", previous: "Previous", next: "Next" }, empty: "No records yet.",
  };
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
    type: translateValue(event.type, lang),
    date: event.event_date,
    amount: event.amount ?? "",
    score: event.score ?? "",
    notes: event.notes,
  }));
  const kpiRows = (users.data ?? []).map((user) => ({
    id: user.id,
    employee: user.full_name,
    role: translateValue(user.role, lang),
    sales_followups: (interactions.data ?? []).filter((item) => item.created_by === user.id).length,
    sales_bookings: (bookings.data ?? []).filter((item) => item.assigned_to === user.id).length,
    hr_events: (events.data ?? []).filter((item) => item.user_id === user.id).length,
  }));
  const teacherKpiRows = (teachers.data ?? []).map((teacher) => ({
    id: teacher.id,
    employee: teacher.name,
    role: translateValue("teacher", lang),
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
    role: translateValue(item.target_role, lang),
    comment: item.comment,
    date: String(item.created_at).slice(0, 10),
  }));
  return (
    <div className="space-y-6">
      <EmployeeEventForm users={users.data ?? []} teachers={teachers.data ?? []} lang={lang} />
      <Card>
        <CardHeader><CardTitle>{labels.payslip}</CardTitle></CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-muted">
              <tr>
                {[labels.employee, labels.role, labels.payType, labels.hours, labels.sessions, labels.base, labels.bonuses, labels.deductions, labels.total, labels.print].map((header) => <th key={header} className="px-4 py-3 text-left">{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {payslips.map((row) => (
                <tr key={`${row.kind}-${row.id}`} className="border-t">
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3">{translateValue(row.role, lang)}</td>
                  <td className="px-4 py-3">{translateValue(row.payType, lang)}</td>
                  <td className="px-4 py-3">{row.hours.toFixed(2)}</td>
                  <td className="px-4 py-3">{row.sessions}</td>
                  <td className="px-4 py-3">{formatMoney(row.basePay)}</td>
                  <td className="px-4 py-3">{formatMoney(row.bonuses)}</td>
                  <td className="px-4 py-3">{formatMoney(row.deductions)}</td>
                  <td className="px-4 py-3 font-semibold">{formatMoney(row.net)}</td>
                  <td className="px-4 py-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/hr/performance/payslip/${row.kind}/${row.id}?start=${periodStart}&end=${periodEnd}`}>{labels.print}</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle>{labels.kpis}</CardTitle></CardHeader><CardContent><DataTable rows={[...kpiRows, ...teacherKpiRows]} labels={labels.table} empty={labels.empty} columns={[{ key: "employee", header: labels.employee }, { key: "role", header: labels.role }, { key: "sales_followups", header: labels.followups }, { key: "sales_bookings", header: labels.bookings }, { key: "hr_events", header: labels.hrNotes }]} /></CardContent></Card>
      <Card><CardHeader><CardTitle>{labels.feedback}</CardTitle></CardHeader><CardContent><DataTable rows={studentWorkerFeedbackRows} labels={labels.table} empty={labels.empty} columns={[{ key: "student", header: labels.student }, { key: "worker", header: labels.worker }, { key: "role", header: labels.role }, { key: "comment", header: labels.comment }, { key: "date", header: labels.date }]} /></CardContent></Card>
      <Card><CardHeader><CardTitle>{labels.events}</CardTitle></CardHeader><CardContent><DataTable rows={eventRows} labels={labels.table} empty={labels.empty} columns={[{ key: "employee", header: labels.employee }, { key: "type", header: labels.type }, { key: "date", header: labels.date }, { key: "amount", header: labels.amount }, { key: "score", header: labels.score }, { key: "notes", header: labels.notes }]} /></CardContent></Card>
    </div>
  );
}
