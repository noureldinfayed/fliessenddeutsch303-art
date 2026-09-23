import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";

async function authorized(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret") ?? request.headers.get("x-cron-secret");
  if (secret && secret === process.env.CRON_SECRET) return true;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("role").eq("id", auth.user?.id ?? "").single();
  return profile?.role === "admin";
}

export async function GET(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  if (!(await authorized(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);
  const [teacherAttendance, teachers, studentAttendance, classes, treasury, interactions, bookings] = await Promise.all([
    supabase.from("teacher_attendance").select("check_in").eq("date", today),
    supabase.from("teachers").select("id"),
    supabase.from("student_attendance").select("status,class_id").eq("date", today),
    supabase.from("classes").select("id,name"),
    supabase.from("treasury_records").select("type,amount").eq("date", today),
    supabase.from("lead_interactions").select("id").gte("created_at", `${today}T00:00:00`),
    supabase.from("leads").select("id").eq("status", "booked").gte("created_at", `${today}T00:00:00`),
  ]);
  const presentTeachers = (teacherAttendance.data ?? []).filter((row) => row.check_in).length;
  const treasuryNet = (treasury.data ?? []).reduce((sum, row) => sum + (row.type === "income" ? Number(row.amount) : -Number(row.amount)), 0);
  const treasuryIncome = (treasury.data ?? []).filter((row) => row.type === "income").reduce((sum, row) => sum + Number(row.amount), 0);
  const treasuryExpense = (treasury.data ?? []).filter((row) => row.type === "expense").reduce((sum, row) => sum + Number(row.amount), 0);
  const classLines = (classes.data ?? []).map((klass) => {
    const rows = (studentAttendance.data ?? []).filter((row) => row.class_id === klass.id);
    const rate = rows.length ? Math.round((rows.filter((row) => row.status === "present" || row.status === "late").length / rows.length) * 100) : 0;
    return `<li>${klass.name}: ${rate}% attendance</li>`;
  }).join("");
  const html = `<div style="font-family:Inter,Arial;color:#0B0B0B"><h1 style="border-bottom:4px solid #DD0000;padding-bottom:8px">Fließend Deutsch Daily Report</h1><h2>Teacher Attendance</h2><p>${presentTeachers} present, ${(teachers.data?.length ?? 0) - presentTeachers} absent</p><h2>Student Attendance</h2><ul>${classLines}</ul><h2>Treasury</h2><p>Income ${formatMoney(treasuryIncome)} · Expense ${formatMoney(treasuryExpense)} · Net ${formatMoney(treasuryNet)}</p><h2>Sales</h2><p>${interactions.data?.length ?? 0} leads contacted today · ${bookings.data?.length ?? 0} new bookings</p><div style="height:6px;background:#FFCE00;margin-top:24px"></div></div>`;
  if (process.env.RESEND_API_KEY) {
    await new Resend(process.env.RESEND_API_KEY).emails.send({ from: process.env.FROM_EMAIL!, to: process.env.REPORT_EMAIL!, subject: `Fließend Deutsch Daily Report - ${today}`, html });
  }
  return NextResponse.json({ sent: Boolean(process.env.RESEND_API_KEY), date: today });
}
