import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { PrintButton } from "@/components/ui/print-button";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney } from "@/lib/utils";

export default async function TeacherStudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await getCurrentUser("teacher");
  const [studentResult, accounts, exams, feedback, attendance, classes, teachers] = await Promise.all([
    supabase.from("students").select("*").eq("id", id).single(),
    supabase.from("student_account_records").select("*").eq("student_id", id).order("created_at", { ascending: false }),
    supabase.from("exam_records").select("*").eq("student_id", id).order("scheduled_at", { ascending: false }),
    supabase.from("feedback_records").select("*").eq("student_id", id).order("created_at", { ascending: false }),
    supabase.from("student_attendance").select("*").eq("student_id", id).order("date", { ascending: false }),
    supabase.from("classes").select("id,name,teacher_id,level,learning_mode,schedule"),
    supabase.from("teachers").select("id,name,user_id"),
  ]);
  const student = studentResult.data;
  if (!student) return <div className="rounded-lg border bg-white p-6">Student not found.</div>;
  const klass = (classes.data ?? []).find((item) => item.id === student.class_id);
  const teacher = (teachers.data ?? []).find((item) => item.id === klass?.teacher_id);
  if (!teacher || (teacher.user_id !== profile.id && teacher.user_id !== user.id)) return <div className="rounded-lg border bg-white p-6">Student not found.</div>;
  const balance = Math.max(0, Number(student.total_price ?? 0) - Number(student.amount_paid ?? 0));

  return (
    <div className="print-sheet space-y-6">
      <Card className="print-card">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>{student.full_name}</CardTitle>
          <div className="print:hidden"><PrintButton label="Print/PDF Profile" /></div>
        </CardHeader>
        <CardContent className="grid gap-x-8 gap-y-3 md:grid-cols-2 print:grid-cols-2">
          {[
            ["Phone", student.phone],
            ["Level", student.level],
            ["Class", klass?.name ?? ""],
            ["Teacher", teacher.name ?? ""],
            ["Mode", student.learning_mode],
            ["Price", formatMoney(Number(student.total_price ?? 0))],
            ["Paid", formatMoney(Number(student.amount_paid ?? 0))],
            ["Not paid", formatMoney(balance)],
            ["Tags", Array.isArray(student.tags) ? student.tags.join(", ") : ""],
            ["Payment arrangement", `${student.payment_due_date ?? ""} ${student.payment_comment ?? ""}`],
          ].map(([label, value]) => (
            <p key={label} className="flex justify-between gap-4 border-b py-1 text-sm">
              <span className="font-medium text-muted-foreground">{label}</span>
              <span className="text-right print:text-left">{value}</span>
            </p>
          ))}
        </CardContent>
      </Card>
      <Card className="print-card print-table"><CardHeader><CardTitle>Accounts</CardTitle></CardHeader><CardContent><DataTable rows={(accounts.data ?? []).map((item) => ({ id: item.id, amount: formatMoney(Number(item.amount)), due_date: item.due_date ?? "", status: item.status, receipt_no: item.receipt_no ?? "", notes: item.notes ?? "" }))} columns={[{ key: "amount", header: "Amount" }, { key: "due_date", header: "Due date" }, { key: "status", header: "Status" }, { key: "receipt_no", header: "Receipt" }, { key: "notes", header: "Notes" }]} /></CardContent></Card>
      <Card className="print-card print-table"><CardHeader><CardTitle>Exams and level assessment</CardTitle></CardHeader><CardContent><DataTable rows={(exams.data ?? []).map((item) => ({ id: item.id, type: item.exam_type, date: String(item.scheduled_at).slice(0, 10), result_level: item.level_result ?? "", score: item.score_percent == null ? "" : `${item.score_percent}%`, comment: item.result_comment ?? "" }))} columns={[{ key: "type", header: "Type" }, { key: "date", header: "Date" }, { key: "result_level", header: "Level" }, { key: "score", header: "%" }, { key: "comment", header: "Comment" }]} /></CardContent></Card>
      <Card className="print-card print-table"><CardHeader><CardTitle>Feedback</CardTitle></CardHeader><CardContent><DataTable rows={(feedback.data ?? []).map((item) => ({ id: item.id, source: item.source, rating: item.rating ?? "", comment: item.comment, date: String(item.created_at).slice(0, 10) }))} columns={[{ key: "source", header: "Source" }, { key: "rating", header: "Rating" }, { key: "comment", header: "Comment" }, { key: "date", header: "Date" }]} /></CardContent></Card>
      <Card className="print-card print-table"><CardHeader><CardTitle>Attendance</CardTitle></CardHeader><CardContent><DataTable rows={(attendance.data ?? []).map((item) => ({ id: item.id, date: item.date, status: item.status }))} columns={[{ key: "date", header: "Date" }, { key: "status", header: "Status" }]} /></CardContent></Card>
    </div>
  );
}
