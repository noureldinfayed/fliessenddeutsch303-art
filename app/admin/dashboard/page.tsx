import Link from "next/link";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { dictionaries } from "@/lib/i18n";
import { getCurrentLanguage } from "@/lib/i18n-server";
import { formatMoney } from "@/lib/utils";

export default async function AdminDashboard() {
  const lang = await getCurrentLanguage();
  const t = dictionaries[lang];
  const { supabase } = await getCurrentUser("admin");
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = new Date(Date.now() - 6 * 86400000).toISOString();
  const [students, classes, teacherAttendance, teachers, treasury, leads, bookings] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("classes").select("id,schedule"),
    supabase.from("teacher_attendance").select("id,check_in").eq("date", today),
    supabase.from("teachers").select("id"),
    supabase.from("treasury_records").select("type,amount").eq("date", today),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", `${today}T00:00:00`),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "booked").gte("created_at", weekStart),
  ]);
  const net = (treasury.data ?? []).reduce((sum, row) => sum + (row.type === "income" ? Number(row.amount) : -Number(row.amount)), 0);
  const present = (teacherAttendance.data ?? []).filter((row) => row.check_in).length;
  const todaysClasses = (classes.data ?? []).filter((row) => String(row.schedule).toLowerCase().includes(new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase())).length;

  const cards = [
    [t.activeStudents, students.count ?? 0],
    [t.classesToday, todaysClasses],
    [t.teacherAttendance, `${present} / ${teachers.data?.length ?? 0}`],
    [t.netTreasuryToday, formatMoney(net)],
    [t.newLeadsToday, `${leads.count ?? 0} / ${bookings.count ?? 0} ${t.bookings}`],
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <CardHeader><CardTitle className="text-sm text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold text-primary">{value}</CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild><Link href="/admin/students">{t.addStudent}</Link></Button>
        <Button asChild variant="outline"><Link href="/admin/treasury">{t.addTreasuryRecord}</Link></Button>
        <form action="/api/reports/daily" method="post"><Button variant="accent"><Send size={16} /> {t.sendDailyReportNow}</Button></form>
      </div>
    </div>
  );
}
