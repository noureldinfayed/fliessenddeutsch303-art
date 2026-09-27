import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as { actor?: string; entityType?: string; entityId?: string; details?: unknown } | null;
  const recipient = process.env.SECURITY_ALERT_EMAIL || process.env.REPORT_EMAIL;
  if (!recipient || !process.env.RESEND_API_KEY) return NextResponse.json({ status: "queued", reason: "email_not_configured" });
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.FROM_EMAIL || "system@example.com",
    to: recipient,
    subject: "Fließend Deutsch security alert: record deleted",
    text: `A record was deleted.\nActor: ${payload?.actor ?? "Unknown"}\nType: ${payload?.entityType ?? "Unknown"}\nID: ${payload?.entityId ?? "Unknown"}\nDetails: ${JSON.stringify(payload?.details ?? {})}`,
  });
  return NextResponse.json({ status: "sent" });
}
