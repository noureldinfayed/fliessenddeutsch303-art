import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { qrDataUrl } from "@/lib/qr";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export default async function LinksPage() {
  const { supabase } = await getCurrentUser("admin");
  const [students, teachers] = await Promise.all([
    supabase.from("students").select("id,full_name,phone").order("full_name"),
    supabase.from("teachers").select("id,name,phone").order("name"),
  ]);
  const studentLinks = await Promise.all((students.data ?? []).slice(0, 30).map(async (student) => {
    const url = `${siteUrl()}/portal/student/${student.id}`;
    return { ...student, url, qr: await qrDataUrl(url) };
  }));
  const teacherLinks = await Promise.all((teachers.data ?? []).slice(0, 30).map(async (teacher) => {
    const url = `${siteUrl()}/portal/teacher/${teacher.id}`;
    return { ...teacher, url, qr: await qrDataUrl(url) };
  }));
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Student links and QR codes</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {studentLinks.map((student) => (
            <div key={student.id} className="rounded-lg border p-4">
              <Image src={student.qr} alt={`${student.full_name} QR`} width={132} height={132} unoptimized />
              <h3 className="mt-2 font-semibold">{student.full_name}</h3>
              <p className="break-all text-xs text-muted-foreground">{student.url}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Teacher links and QR codes</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {teacherLinks.map((teacher) => (
            <div key={teacher.id} className="rounded-lg border p-4">
              <Image src={teacher.qr} alt={`${teacher.name} QR`} width={132} height={132} unoptimized />
              <h3 className="mt-2 font-semibold">{teacher.name}</h3>
              <p className="break-all text-xs text-muted-foreground">{teacher.url}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
