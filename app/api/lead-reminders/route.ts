import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export async function GET() {
  if (!hasSupabaseEnv()) return NextResponse.json({ reminders: [] });
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ reminders: [] }, { status: 401 });
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase.from("lead_reminders").select("id,lead_id,due_at,note,leads(full_name)").eq("user_id", auth.user.id).is("read_at", null).lte("due_at", today).order("due_at");
  return NextResponse.json({ reminders: data ?? [], error: error?.message });
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return NextResponse.json({ queued: true });
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("users").select("id,role").eq("id", auth.user.id).single();
  if (!profile || !["admin", "sales"].includes(profile.role)) return NextResponse.json({ error: "Only admin and sales can create reminders" }, { status: 403 });
  const { leadId, dueAt, note } = await request.json();
  const { data: recipients } = await supabase.from("users").select("id").in("role", ["admin", "reception", "sales"]).eq("is_active", true);
  const rows = (recipients ?? []).map((recipient) => ({ lead_id: leadId, user_id: recipient.id, due_at: dueAt, note: note ?? "", created_by: auth.user.id }));
  const { error } = await supabase.from("lead_reminders").insert(rows);
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ count: rows.length });
}
