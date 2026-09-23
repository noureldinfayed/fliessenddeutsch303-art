import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const comment = String(body.comment ?? "").trim();
    const studentId = String(body.student_id ?? "");
    const target = String(body.target ?? "");
    const [targetType, targetId] = target.split(":");

    if (!studentId || !comment || !targetId || !["teacher", "reception"].includes(targetType)) {
      return NextResponse.json({ error: "Missing feedback details" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("student_worker_feedback").insert({
      student_id: studentId,
      target_role: targetType,
      target_teacher_id: targetType === "teacher" ? targetId : null,
      target_user_id: targetType === "reception" ? targetId : null,
      comment,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save feedback" }, { status: 400 });
  }
}
