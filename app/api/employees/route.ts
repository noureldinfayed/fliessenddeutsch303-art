import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { tempPassword } from "@/lib/utils";

async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Unauthorized");
  const { data: profile } = await supabase.from("users").select("role").eq("id", auth.user.id).single();
  if (profile?.role !== "admin") throw new Error("Unauthorized");
}

export async function POST(request: Request) {
  try {
    await assertAdmin();
    const body = await request.json();
    const temporaryPassword = tempPassword();
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.createUser({ email: body.email, password: temporaryPassword, email_confirm: true });
    if (error || !data.user) throw error;
    await admin.from("users").insert({
      id: data.user.id,
      full_name: body.full_name,
      email: body.email,
      role: body.role,
      is_active: body.is_active,
      permissions: body.permissions ?? {},
      payroll_type: body.payroll_type ?? "monthly_salary",
      monthly_salary: Number(body.monthly_salary ?? 0),
      monthly_wage: Number(body.monthly_wage ?? 0),
      hourly_rate: Number(body.hourly_rate ?? 0),
    });
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: body.email,
        subject: "Your Fließend Deutsch System Access",
        html: `<div style="font-family:Inter,Arial;color:#0B0B0B"><h1 style="border-bottom:4px solid #DD0000;padding-bottom:8px">Welcome, ${body.full_name}</h1><p>Login URL: ${process.env.NEXT_PUBLIC_SITE_URL}/login</p><p>Email: ${body.email}</p><p>Temporary password: <strong>${temporaryPassword}</strong></p><p>Please log in and you will be prompted to change your password on first login.</p><div style="height:6px;background:#FFCE00;margin-top:24px"></div></div>`,
      });
    }
    return NextResponse.json({ temporaryPassword });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    await assertAdmin();
    const body = await request.json();
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("users").update({
      full_name: body.full_name,
      email: body.email,
      role: body.role,
      is_active: body.is_active,
      permissions: body.permissions ?? {},
      payroll_type: body.payroll_type ?? "monthly_salary",
      monthly_salary: Number(body.monthly_salary ?? 0),
      monthly_wage: Number(body.monthly_wage ?? 0),
      hourly_rate: Number(body.hourly_rate ?? 0),
    }).eq("id", body.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 400 });
  }
}
