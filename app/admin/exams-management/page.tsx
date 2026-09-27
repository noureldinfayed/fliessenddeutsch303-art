import { ExamRecordForm } from "@/components/forms/client-addition-forms";
import { ExamManager } from "@/components/forms/exam-manager";
import { getCurrentUser } from "@/lib/auth";

type Exam = {
  id: string;
  student_id: string | null;
  exam_type: string;
  scheduled_at: string;
  level_result: string | null;
  score_percent: number | null;
  result_comment: string | null;
  booking_status?: string | null;
  booked_class_id?: string | null;
};

export default async function ExamsManagementPage() {
  const { supabase } = await getCurrentUser("admin");
  const [students, classes, exams] = await Promise.all([
    supabase.from("students").select("id,full_name,level,class_id").order("full_name"),
    supabase.from("classes").select("id,name").order("name"),
    supabase.from("exam_records").select("id,student_id,exam_type,scheduled_at,level_result,score_percent,result_comment,booking_status,booked_class_id").order("scheduled_at", { ascending: false }),
  ]);
  const classRows = classes.data ?? [];
  const examRows = (exams.data ?? []) as Exam[];
  const rows = (students.data ?? []).map((student) => {
    const studentExams = examRows.filter((exam) => exam.student_id === student.id);
    const levelTest = studentExams.find((exam) => exam.exam_type === "placement") ?? null;
    const quiz = studentExams.find((exam) => ["quiz", "internal"].includes(exam.exam_type)) ?? null;
    const mainTest = studentExams.find((exam) => exam.exam_type === "main") ?? null;
    const nextLevelBooking = mainTest?.booking_status === "booked" || levelTest?.booking_status === "booked";
    const bookedClassId = mainTest?.booked_class_id ?? levelTest?.booked_class_id ?? (nextLevelBooking ? student.class_id : null);
    return {
      id: student.id,
      student_id: student.id,
      full_name: student.full_name,
      current_level: student.level,
      level_test_date: levelTest?.scheduled_at?.slice(0, 10),
      level_test_taken: Boolean(levelTest && (levelTest.score_percent != null || levelTest.level_result)),
      level_result: levelTest?.level_result,
      level_test_score: levelTest?.score_percent,
      level_test_comment: levelTest?.result_comment,
      quiz_result: quiz ? `${quiz.score_percent == null ? "" : `${quiz.score_percent}%`} ${quiz.result_comment ?? ""}`.trim() : null,
      quiz_score: quiz?.score_percent,
      quiz_comment: quiz?.result_comment,
      main_test_result: mainTest?.score_percent == null ? null : `${mainTest.score_percent}% ${mainTest.result_comment ?? ""}`.trim(),
      main_score: mainTest?.score_percent,
      main_comment: mainTest?.result_comment,
      main_test_passed: mainTest?.score_percent == null ? null : mainTest.score_percent >= 60,
      next_level_booked: Boolean(nextLevelBooking),
      booked_group: classRows.find((item) => item.id === bookedClassId)?.name ?? null,
    };
  });

  return <div className="space-y-6"><ExamRecordForm students={students.data ?? []} classes={classRows} /><ExamManager rows={rows} classes={classRows} /></div>;
}
