import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { tempPassword } from "@/lib/utils";
import { hashLocalPassword } from "@/lib/local-auth";
import { hasSupabaseAdminEnv } from "@/lib/env";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: adminProfile } = await supabase.from("users").select("role").eq("id", auth.user?.id ?? "").single();
  if (adminProfile?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await request.json();
  const admin = createSupabaseAdminClient();
  const temporaryPassword = tempPassword();
  if (!hasSupabaseAdminEnv()) {
    const { error } = await admin.from("users").update({ password_hash: hashLocalPassword(temporaryPassword) }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ password: temporaryPassword });
  }
  const { data: userData, error } = await admin.auth.admin.updateUserById(id, { password: temporaryPassword });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { data: profile } = await admin.from("users").select("full_name").eq("id", id).single();
  const email = userData.user.email;
  if (process.env.RESEND_API_KEY && email) {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.FROM_EMAIL!,
      to: email,
      subject: "Your Fließend Deutsch Password Reset",
      html: `<div style="font-family:Inter,Arial;color:#0B0B0B"><h1 style="border-bottom:4px solid #DD0000;padding-bottom:8px">Password reset</h1><p>Hello ${profile?.full_name ?? ""}, your temporary password is <strong>${temporaryPassword}</strong>.</p><div style="height:6px;background:#FFCE00;margin-top:24px"></div></div>`,
    });
  }
  return NextResponse.json({ password: temporaryPassword });
}
