import type { SupabaseClient } from "@supabase/supabase-js";

type ClassProgress = {
  sessions_done: number;
  total_sessions: number;
  last_session_completed_date: string | null;
  class_status: string;
  student_scan_count: number;
  teacher_scanned: boolean;
  session_qualified: boolean;
};

export async function refreshClassSessionProgress(supabase: SupabaseClient, classId: string, date: string): Promise<ClassProgress> {
  const { data: classRow } = await supabase
    .from("classes")
    .select("id,teacher_id,total_sessions,sessions_done,last_session_completed_date,class_status")
    .eq("id", classId)
    .single();

  if (!classRow) {
    return { sessions_done: 0, total_sessions: 0, last_session_completed_date: null, class_status: "not_started", student_scan_count: 0, teacher_scanned: false, session_qualified: false };
  }

  const [{ data: studentRows }, { data: teacherRows }] = await Promise.all([
    supabase.from("student_attendance").select("student_id,status").eq("class_id", classId).eq("date", date).eq("status", "present"),
    classRow.teacher_id
      ? supabase.from("teacher_attendance").select("id,check_in").eq("teacher_id", classRow.teacher_id).eq("date", date)
      : Promise.resolve({ data: [] }),
  ]);

  const studentScanCount = new Set((studentRows ?? []).map((row) => row.student_id)).size;
  const teacherScanned = (teacherRows ?? []).some((row) => row.check_in);
  const sessionQualified = studentScanCount >= 3 && teacherScanned;
  const sessionsDone = Number(classRow.sessions_done ?? 0);
  const totalSessions = Number(classRow.total_sessions ?? 0);
  const classStatus = String(classRow.class_status ?? (sessionsDone >= totalSessions && totalSessions > 0 ? "finished" : sessionsDone > 0 ? "started" : "not_started"));
  const alreadyCountedToday = classRow.last_session_completed_date === date;

  if (sessionQualified && !alreadyCountedToday && sessionsDone < totalSessions) {
    const nextSessionsDone = sessionsDone + 1;
    const nextStatus = nextSessionsDone >= totalSessions && totalSessions > 0 ? "finished" : classStatus === "not_started" ? "started" : classStatus;
    const { error } = await supabase.from("classes").update({ sessions_done: nextSessionsDone, last_session_completed_date: date, class_status: nextStatus }).eq("id", classId);
    if (!error) {
      return { sessions_done: nextSessionsDone, total_sessions: totalSessions, last_session_completed_date: date, class_status: nextStatus, student_scan_count: studentScanCount, teacher_scanned: teacherScanned, session_qualified: true };
    }
  }

  return { sessions_done: sessionsDone, total_sessions: totalSessions, last_session_completed_date: classRow.last_session_completed_date ?? null, class_status: classStatus, student_scan_count: studentScanCount, teacher_scanned: teacherScanned, session_qualified: sessionQualified };
}
