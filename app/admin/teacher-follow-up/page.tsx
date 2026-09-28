import { StudentFollowUpManager } from "@/components/forms/student-follow-up-manager";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentLanguage } from "@/lib/i18n-server";

export default async function AdminTeacherFollowUpPage() {
  const { supabase } = await getCurrentUser("admin");
  const lang = await getCurrentLanguage();
  const [students, classes, teachers] = await Promise.all([
    supabase.from("students").select("id,full_name,phone,email,level,tags,class_id,learning_mode,status,total_price,amount_paid,payment_due_date,payment_comment,created_at").order("created_at", { ascending: false }),
    supabase.from("classes").select("id,name,teacher_id").order("name"),
    supabase.from("teachers").select("id,name").order("name"),
  ]);
  const classRows = classes.data ?? [];
  const teacherRows = teachers.data ?? [];
  const rows = (students.data ?? []).map((student) => {
    const klass = classRows.find((item) => item.id === student.class_id);
    return {
      ...student,
      class_name: klass?.name ?? "",
      teacher_name: teacherRows.find((teacher) => teacher.id === klass?.teacher_id)?.name ?? "",
      account_notes: [],
      exams: [],
      feedback: [],
      attendance: [],
    };
  });
  return <StudentFollowUpManager initialStudents={rows} classes={classRows.map((item) => ({ id: item.id, name: item.name }))} canEdit={false} mode="teacher" teacherId={teacherRows[0]?.id} lang={lang} />;
}
