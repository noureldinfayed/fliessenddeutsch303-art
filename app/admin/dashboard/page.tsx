import Link from "next/link";
import { ArrowUpRight, BookOpen, CalendarCheck2, CircleDollarSign, ClipboardList, Send, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentLanguage } from "@/lib/i18n-server";
import { formatMoney } from "@/lib/utils";

function dateOnly(date = new Date()) { return date.toISOString().slice(0, 10); }
function isPositiveAttendance(status: string) { return status === "present" || status === "late"; }

export default async function AdminDashboard() {
  await getCurrentLanguage();
  const { supabase } = await getCurrentUser("admin");
  const today = dateOnly();
  const monthStart = dateOnly(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const weekStart = new Date(Date.now() - 6 * 86400000).toISOString();
  const weekday = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const [students, classes, studentAttendance, teacherAttendance, teachers, employeeAttendance, treasury, leads, interactions, exams, books, accounts] = await Promise.all([
    supabase.from("students").select("id,status"), supabase.from("classes").select("id,name,schedule,class_status,sessions_done,total_sessions"),
    supabase.from("student_attendance").select("id,status,date"), supabase.from("teacher_attendance").select("id,check_in,date"),
    supabase.from("teachers").select("id"), supabase.from("employee_attendance").select("id,user_id,check_in,date"),
    supabase.from("treasury_records").select("type,amount,date"), supabase.from("leads").select("id,status,created_at"),
    supabase.from("lead_interactions").select("id,created_at"), supabase.from("exam_records").select("id,exam_type,scheduled_at,booking_status"),
    supabase.from("textbook_inventory").select("id,quantity_on_hand,quantity_needed,quantity_ordered"), supabase.from("student_account_records").select("id,status,due_date,amount"),
  ]);
  const studentRows = students.data ?? [], classRows = classes.data ?? [], studentAttendanceRows = studentAttendance.data ?? [], teacherAttendanceRows = teacherAttendance.data ?? [], employeeAttendanceRows = employeeAttendance.data ?? [], treasuryRows = treasury.data ?? [], leadRows = leads.data ?? [], interactionRows = interactions.data ?? [], examRows = exams.data ?? [], bookRows = books.data ?? [], accountRows = accounts.data ?? [];
  const sum = (rows: typeof treasuryRows, type: string) => rows.filter((row) => row.type === type).reduce((total, row) => total + Number(row.amount), 0);
  const todayTreasury = treasuryRows.filter((row) => row.date === today), monthTreasury = treasuryRows.filter((row) => row.date >= monthStart);
  const incomeToday = sum(todayTreasury, "income"), expensesToday = sum(todayTreasury, "expense"), incomeMonth = sum(monthTreasury, "income"), expensesMonth = sum(monthTreasury, "expense");
  const todayStudents = studentAttendanceRows.filter((row) => row.date === today), todayTeachers = teacherAttendanceRows.filter((row) => row.date === today && row.check_in).length, todayEmployees = employeeAttendanceRows.filter((row) => row.date === today && row.check_in);
  const newLeads = leadRows.filter((row) => String(row.created_at).startsWith(today)), waitingLeads = leadRows.filter((row) => row.status === "waiting"), bookingsToday = leadRows.filter((row) => row.status === "booked" && String(row.created_at).startsWith(today)), bookingsWeek = leadRows.filter((row) => row.status === "booked" && String(row.created_at) >= weekStart);
  const followupsToday = interactionRows.filter((row) => String(row.created_at).startsWith(today)), followupsMonth = interactionRows.filter((row) => String(row.created_at).slice(0, 10) >= monthStart), upcomingExams = examRows.filter((row) => String(row.scheduled_at).slice(0, 10) >= today);
  const booksNeedingOrder = bookRows.filter((row) => Math.max(0, Number(row.quantity_needed) - Number(row.quantity_on_hand)) > Number(row.quantity_ordered ?? 0)), overdueAccounts = accountRows.filter((row) => row.status !== "paid" && row.due_date && row.due_date < today), todaysClasses = classRows.filter((row) => String(row.schedule).toLowerCase().includes(weekday)).length;
  const cards = [
    ["Active students", studentRows.filter((row) => row.status === "active").length, "/admin/students", Users], ["Classes today", todaysClasses, "/admin/classes", CalendarCheck2], ["Student attendance today", `${todayStudents.filter((row) => isPositiveAttendance(row.status)).length} / ${todayStudents.length}`, "/admin/student-attendance", ClipboardList], ["Employees checked in", `${todayEmployees.length}`, "/admin/hr/attendance", Users], ["Teachers present", `${todayTeachers} / ${teachers.data?.length ?? 0}`, "/admin/hr/attendance", Users], ["Income today", formatMoney(incomeToday), "/admin/treasury", CircleDollarSign], ["Expenses today", formatMoney(expensesToday), "/admin/treasury", Wallet], ["Profit today", formatMoney(incomeToday - expensesToday), "/admin/reports", CircleDollarSign], ["Income this month", formatMoney(incomeMonth), "/admin/reports", CircleDollarSign], ["Monthly profit", formatMoney(incomeMonth - expensesMonth), "/admin/reports", CircleDollarSign], ["New leads today", newLeads.length, "/admin/sales", Users], ["Waiting leads", waitingLeads.length, "/admin/sales", ClipboardList], ["Bookings today / week", `${bookingsToday.length} / ${bookingsWeek.length}`, "/admin/sales", CalendarCheck2], ["Follow-ups today / month", `${followupsToday.length} / ${followupsMonth.length}`, "/admin/reports", ClipboardList], ["Upcoming exams", upcomingExams.length, "/admin/exams-management", BookOpen],
  ] as const;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#DD0000] pb-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#DD0000]">Fließend Deutsch</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Control panel</h2><p className="mt-1 text-sm text-muted-foreground">Live overview of students, operations, sales, finance, and staff.</p></div><span className="text-sm text-muted-foreground">{today}</span></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([label, value, href, Icon]) => <Link key={label} href={href} className="group"><Card className="h-full transition hover:-translate-y-0.5 hover:border-[#DD0000]"><CardHeader className="flex-row items-start justify-between pb-2"><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle><Icon size={18} className="text-[#DD0000]" /></CardHeader><CardContent className="flex items-end justify-between text-2xl font-semibold text-primary"><span>{value}</span><ArrowUpRight size={16} className="text-muted-foreground opacity-0 transition group-hover:opacity-100" /></CardContent></Card></Link>)}</div>
    <div className="grid gap-4 lg:grid-cols-3"><Card><CardHeader><CardTitle>Operational alerts</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><Link className="flex justify-between border-b pb-2 hover:text-[#DD0000]" href="/admin/students"><span>Overdue student payments</span><strong>{overdueAccounts.length}</strong></Link><Link className="flex justify-between border-b pb-2 hover:text-[#DD0000]" href="/admin/textbooks"><span>Books needing order</span><strong>{booksNeedingOrder.length}</strong></Link><Link className="flex justify-between hover:text-[#DD0000]" href="/admin/classes"><span>Classes not started</span><strong>{classRows.filter((row) => row.class_status === "not_started").length}</strong></Link></CardContent></Card><Card><CardHeader><CardTitle>Class progress</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">{classRows.slice(0, 5).map((row) => <div key={row.id} className="flex justify-between border-b pb-2"><span>{row.name}</span><span className="font-semibold">{row.sessions_done ?? 0} / {row.total_sessions ?? 0}</span></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Quick actions</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2"><Button asChild><Link href="/admin/students">Add student</Link></Button><Button asChild variant="outline"><Link href="/admin/treasury">Add treasury record</Link></Button><Button asChild variant="outline"><Link href="/admin/account-center">Account Center</Link></Button><form action="/api/reports/daily" method="post"><Button variant="accent"><Send size={16} /> Send daily report</Button></form></CardContent></Card></div>
  </div>;
}
