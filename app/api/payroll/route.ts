import { NextResponse } from "next/server";
import { calculatePayslips } from "@/lib/payslip";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("role").eq("id", auth.user?.id ?? "").single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const start = url.searchParams.get("start")!;
  const end = url.searchParams.get("end")!;
  const rows = (await calculatePayslips(supabase, start, end)).map((row) => ({
    employee: row.name,
    role: row.role,
    payType: row.payType,
    hours: row.hours,
    sessions: row.sessions,
    basePay: row.basePay,
    bonuses: row.bonuses,
    deductions: row.deductions,
    net: row.net,
  }));
  return NextResponse.json(rows);
}
