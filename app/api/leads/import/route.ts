import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("role,permissions").eq("id", auth.user?.id ?? "").single();
  if (!["admin", "sales"].includes(profile?.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { campaign, assignedTo, rows } = await request.json();
  const { data: file, error } = await supabase.from("lead_files").insert({ name: campaign, uploaded_by: auth.user!.id, total_leads: rows.length }).select("id").single();
  if (error || !file) return NextResponse.json({ error: error?.message ?? "File import failed" }, { status: 400 });
  const leads = rows.map((row: { full_name: string; phone: string; source?: string; tags?: string[]; crm_data?: Record<string, string> }) => ({ ...row, file_id: file.id, assigned_to: assignedTo || null, status: "new" }));
  const { error: leadError } = await supabase.from("leads").insert(leads);
  if (leadError) return NextResponse.json({ error: leadError.message }, { status: 400 });
  if (profile?.role === "admin" && assignedTo) {
    const { data: rep } = await supabase.from("users").select("permissions").eq("id", assignedTo).single();
    const files = new Set([...(rep?.permissions?.assigned_files ?? []), file.id]);
    await supabase.from("users").update({ permissions: { ...(rep?.permissions ?? {}), assigned_files: [...files] } }).eq("id", assignedTo);
  }
  return NextResponse.json({ count: rows.length, file_id: file.id });
}
