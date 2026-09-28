import { getCurrentUser } from "@/lib/auth";
import { getCurrentLanguage } from "@/lib/i18n-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fieldLabels: Record<string, [string, string]> = {
  amount_paid: ["Amount paid", "المبلغ المدفوع"], payment_comment: ["Payment comment", "تعليق السداد"],
  name: ["Name", "الاسم"], status: ["Status", "الحالة"], class_status: ["Class status", "حالة الفصل"],
};

function readableDetails(details: unknown, ar: boolean) {
  if (!details || typeof details !== "object") return String(details ?? "-");
  const record = details as Record<string, unknown>;
  return Object.entries(record).map(([key, value]) => {
    const label = fieldLabels[key]?.[ar ? 1 : 0] ?? key.replaceAll("_", " ");
    if (key === "fields" && Array.isArray(value)) {
      const fields = value.map((field) => fieldLabels[String(field)]?.[ar ? 1 : 0] ?? String(field).replaceAll("_", " ")).join(ar ? "، " : ", ");
      return `${ar ? "الحقول المحدثة" : "Updated fields"}: ${fields}`;
    }
    return `${label}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`;
  }).join(ar ? " · " : " · ");
}

export default async function AdminLogsPage() {
  const lang = await getCurrentLanguage();
  const ar = lang === "ar";
  const { supabase } = await getCurrentUser("admin");
  const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false });
  const headers = ar ? ["الموظف", "البريد الإلكتروني", "الإجراء", "النوع", "السجل", "التفاصيل", "التاريخ", "الوقت"] : ["Worker", "Email", "Action", "Type", "Record", "Details", "Date", "Time"];
  const actions: Record<string, string> = ar ? { created: "إنشاء", updated: "تعديل", deleted: "حذف", imported: "استيراد", exported: "تصدير" } : {};
  const entities: Record<string, string> = ar ? { student: "طالب", class: "فصل", lead: "عميل محتمل", treasury: "خزينة", employee: "موظف", textbook: "كتاب", exam: "اختبار" } : {};
  return <Card dir={ar ? "rtl" : "ltr"}><CardHeader><CardTitle>{ar ? "سجل النشاط" : "Activity logs"}</CardTitle></CardHeader><CardContent className="p-0"><div className="max-h-[75vh] overflow-auto"><table className="w-full min-w-[1050px] text-sm"><thead className="sticky top-0 z-10 bg-muted"><tr>{headers.map((header) => <th key={header} className="px-4 py-3 text-start font-semibold">{header}</th>)}</tr></thead><tbody>{(data ?? []).map((log) => { const date = new Date(log.created_at); return <tr key={log.id} className="border-t"><td className="px-4 py-3 font-semibold">{log.actor_name}</td><td className="px-4 py-3">{log.actor_email}</td><td className="px-4 py-3">{actions[log.action] ?? log.action}</td><td className="px-4 py-3">{entities[log.entity_type] ?? log.entity_type}</td><td className="px-4 py-3">{log.entity_id}</td><td className="max-w-[420px] whitespace-pre-wrap px-4 py-3">{readableDetails(log.details, ar)}</td><td className="px-4 py-3">{date.toLocaleDateString(ar ? "ar-EG" : undefined)}</td><td className="px-4 py-3">{date.toLocaleTimeString(ar ? "ar-EG" : undefined)}</td></tr>; })}</tbody></table>{!(data ?? []).length && <p className="p-8 text-center text-muted-foreground">{ar ? "لا توجد سجلات نشاط بعد." : "No activity logs yet."}</p>}</div></CardContent></Card>;
}
