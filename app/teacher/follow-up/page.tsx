import { StudentFollowUpManager } from "@/components/forms/student-follow-up-manager";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentLanguage } from "@/lib/i18n-server";

export default async function TeacherFollowUpPage() {
  const { supabase, user, profile } = await getCurrentUser("teacher");
  const lang = await getCurrentLanguage();
  const teachersResult = await supabase.from("teachers").select("id,name,user_id").order("name");
  const teacher = (teachersResult.data ?? []).find((item) => item.user_id === profile.id || item.user_id === user.id);
  const [students, classes, teachers, accounts, exams, feedback, attendance] = await Promise.all([
    supabase.from("students").select("id,full_name,phone,email,level,tags,class_id,learning_mode,status,total_price,amount_paid,payment_due_date,payment_comment,created_at").order("created_at", { ascending: false }),
    supabase.from("classes").select("id,name,teacher_id,level,learning_mode,schedule").eq("teacher_id", teacher?.id ?? ""),
    supabase.from("teachers").select("id,name").order("name"),
    supabase.from("student_account_records").select("student_id,amount,status,due_date,notes,created_at").order("created_at", { ascending: false }),
    supabase.from("exam_records").select("student_id,exam_type,scheduled_at,level_result,score_percent,result_comment").order("scheduled_at", { ascending: false }),
    supabase.from("feedback_records").select("id,student_id,teacher_id,source,rating,comment,created_at").order("created_at", { ascending: false }),
    supabase.from("student_attendance").select("student_id,date,status").order("date", { ascending: false }),
  ]);
  const classRows = classes.data ?? [];
  const classIds = new Set(classRows.map((item) => item.id));
  const teacherRows = teachers.data ?? [];
  const followUpRows = (students.data ?? []).filter((student) => classIds.has(student.class_id ?? "")).map((student) => {
    const klass = classRows.find((item) => item.id === student.class_id);
    const rowTeacher = teacherRows.find((item) => item.id === klass?.teacher_id);
    return {
      ...student,
      class_name: klass?.name ?? "",
      teacher_name: rowTeacher?.name ?? "",
      schedule: klass?.schedule ?? "",
      account_notes: (accounts.data ?? []).filter((item) => item.student_id === student.id).map((item) => `${item.status} ${item.due_date ?? ""}: ${item.notes ?? ""}`),
      exams: (exams.data ?? []).filter((item) => item.student_id === student.id).map((item) => ({
        type: item.exam_type,
        date: String(item.scheduled_at).slice(0, 10),
        level: item.level_result ?? "",
        score: item.score_percent == null ? "" : `${item.score_percent}%`,
        comment: item.result_comment ?? "",
      })),
      feedback: (feedback.data ?? []).filter((item) => item.student_id === student.id).map((item) => ({
        id: item.id,
        teacher_id: item.teacher_id,
        source: item.source,
        rating: item.rating == null ? "" : String(item.rating),
        comment: item.comment,
        date: String(item.created_at).slice(0, 10),
      })),
      attendance: (attendance.data ?? []).filter((item) => item.student_id === student.id).map((item) => ({
        date: item.date,
        status: item.status,
      })),
    };
  });

  return <StudentFollowUpManager initialStudents={followUpRows} classes={classRows.map((item) => ({ id: item.id, name: item.name }))} canEdit={false} mode="teacher" teacherId={teacher?.id} lang={lang} />;
}
