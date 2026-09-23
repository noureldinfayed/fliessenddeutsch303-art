import type { Role, UserProfile } from "@/lib/types";

type Row = Record<string, any>;
type Result<T = any> = { data: T; error: null; count?: number | null };

const now = new Date().toISOString();
const today = new Date().toISOString().slice(0, 10);

const ids = {
  admin: "local-admin",
  reception: "local-reception",
  sales: "local-sales",
  teacherUser: "local-teacher-user",
  teacher: "local-teacher",
  teacher2: "local-teacher-2",
  classA1: "local-class-a1",
  classB1: "local-class-b1",
  file: "local-file",
  branch: "local-branch-main",
};

const db: Record<string, Row[]> = {
  users: [
    { id: ids.admin, full_name: "Local Admin", email: "admin@local.test", role: "admin", is_active: true, permissions: {}, payroll_type: "monthly_salary", monthly_salary: 18000, monthly_wage: 0, hourly_rate: 0, created_at: now },
    { id: ids.reception, full_name: "Local Reception", email: "reception@local.test", role: "reception", is_active: true, permissions: {}, payroll_type: "monthly_salary", monthly_salary: 9000, monthly_wage: 0, hourly_rate: 0, created_at: now },
    { id: ids.sales, full_name: "Local Sales", email: "sales@local.test", role: "sales", is_active: true, permissions: { assigned_files: [ids.file] }, payroll_type: "hourly", monthly_salary: 0, monthly_wage: 0, hourly_rate: 120, created_at: now },
    { id: ids.teacherUser, full_name: "Local Teacher", email: "teacher@local.test", role: "teacher", is_active: true, permissions: {}, payroll_type: "monthly_salary", monthly_salary: 0, monthly_wage: 0, hourly_rate: 0, created_at: now },
  ],
  teachers: [
    { id: ids.teacher, user_id: ids.teacherUser, name: "Herr Müller", phone: "01000000001", pay_type: "hourly", base_rate: 250, created_at: now },
    { id: ids.teacher2, user_id: null, name: "Frau Schneider", phone: "01000000002", pay_type: "per_session", base_rate: 400, created_at: now },
  ],
  branches: [
    { id: ids.branch, name: "Main Branch", address: "Nasr City", phone: "01000000000", is_active: true, created_at: now },
  ],
  classes: [
    { id: ids.classA1, name: "A1 Evening", teacher_id: ids.teacher, branch_id: ids.branch, level: "A1", learning_mode: "offline", schedule: "Sunday Tuesday 18:00", capacity: 16, created_at: now },
    { id: ids.classB1, name: "B1 Morning", teacher_id: ids.teacher2, branch_id: ids.branch, level: "B1", learning_mode: "online", schedule: "Monday Wednesday 10:00", capacity: 14, created_at: now },
  ],
  students: Array.from({ length: 10 }, (_, index) => ({
    id: `local-student-${index + 1}`,
    full_name: `Student ${index + 1}`,
    phone: `0101000000${index}`,
    email: `student${index + 1}@local.test`,
    level: index < 5 ? "A1" : "B1",
    tags: index % 2 === 0 ? ["electric company"] : ["water company"],
    class_id: index % 2 === 0 ? ids.classA1 : ids.classB1,
    branch_id: ids.branch,
    learning_mode: index % 2 === 0 ? "offline" : "online",
    total_price: 8500,
    amount_paid: index % 3 === 0 ? 3000 : 8500,
    payment_due_date: index % 3 === 0 ? new Date(Date.now() + (index === 0 ? -1 : 1) * 86400000).toISOString().slice(0, 10) : null,
    payment_comment: index % 3 === 0 ? "Arranged remaining payment with student." : "",
    status: "active",
    enrolled_at: now,
    created_at: now,
  })),
  teacher_attendance: [
    { id: "local-ta-1", teacher_id: ids.teacher, date: today, check_in: "10:00", check_out: "14:00", sessions_count: 0, notes: "Local sample", recorded_by: ids.reception },
  ],
  employee_attendance: [
    { id: "local-ea-1", user_id: ids.sales, date: today, check_in: "09:00", check_out: "17:00", notes: "Sales shift", recorded_by: ids.admin, created_at: now },
    { id: "local-ea-2", user_id: ids.reception, date: today, check_in: "10:00", check_out: "18:00", notes: "Reception shift", recorded_by: ids.admin, created_at: now },
  ],
  teacher_adjustments: [
    { id: "local-adj-1", teacher_id: ids.teacher, type: "bonus", amount: 500, reason: "Demo bonus", period_start: today, period_end: today, created_by: ids.admin, created_at: now },
  ],
  employee_adjustments: [
    { id: "local-eadj-1", user_id: ids.reception, type: "bonus", amount: 400, reason: "Extra front desk coverage", period_start: today, period_end: today, created_by: ids.admin, created_at: now },
    { id: "local-eadj-2", user_id: ids.sales, type: "deduction", amount: 200, reason: "Late arrival", period_start: today, period_end: today, created_by: ids.admin, created_at: now },
  ],
  student_attendance: [
    { id: "local-sa-1", student_id: "local-student-1", class_id: ids.classA1, date: today, status: "present", recorded_by: ids.reception },
    { id: "local-sa-2", student_id: "local-student-2", class_id: ids.classB1, date: today, status: "late", recorded_by: ids.reception },
  ],
  lead_files: [{ id: ids.file, name: "Local Facebook Campaign", uploaded_by: ids.admin, upload_date: now, total_leads: 5 }],
  leads: Array.from({ length: 5 }, (_, index) => ({
    id: `local-lead-${index + 1}`,
    full_name: `Lead ${index + 1}`,
    phone: `0102000000${index}`,
    source: "Local Facebook Campaign",
    file_id: ids.file,
    status: index === 0 ? "booked" : "new",
    assigned_to: ids.sales,
    converted_to_student_id: null,
    created_at: now,
  })),
  lead_interactions: [
    { id: "local-interaction-1", lead_id: "local-lead-1", note: "Asked about A1 schedule.", created_by: ids.sales, created_at: now },
  ],
  treasury_records: [
    { id: "local-tr-1", type: "income", amount: 12000, description: "Demo tuition", category: "Tuition", date: today, branch_id: ids.branch, created_by: ids.admin },
    { id: "local-tr-2", type: "expense", amount: 2500, description: "Demo rent", category: "Rent", date: today, branch_id: ids.branch, created_by: ids.admin },
    { id: "local-tr-3", type: "income", amount: 18000, description: "A1 course payments", category: "A1 Evening", date: today, branch_id: ids.branch, created_by: ids.admin },
  ],
  student_account_records: [
    { id: "local-ar-1", student_id: "local-student-1", class_id: ids.classA1, teacher_id: ids.teacher, received_by: ids.reception, amount: 3000, due_date: today, paid_at: null, status: "overdue", notes: "Remaining payment arranged.", receipt_no: "FD-1001", created_at: now },
    { id: "local-ar-2", student_id: "local-student-2", class_id: ids.classB1, teacher_id: ids.teacher2, received_by: ids.admin, amount: 8500, due_date: today, paid_at: now, status: "paid", notes: "Full payment received.", receipt_no: "FD-1002", created_at: now },
  ],
  exam_records: [
    { id: "local-exam-1", student_id: "local-student-1", exam_type: "placement", scheduled_at: now, level_result: "A2", score_percent: 78, result_comment: "Strong grammar, needs speaking confidence.", created_by: ids.admin, created_at: now },
    { id: "local-exam-2", student_id: "local-student-2", exam_type: "osd", scheduled_at: new Date(Date.now() + 7 * 86400000).toISOString(), level_result: "", score_percent: null, result_comment: "ÖSD booking pending confirmation.", created_by: ids.reception, created_at: now },
  ],
  feedback_records: [
    { id: "local-feedback-1", student_id: "local-student-1", teacher_id: ids.teacher, source: "teacher", rating: 4, comment: "Good attendance and homework discipline.", created_by: ids.teacherUser, created_at: now },
    { id: "local-feedback-2", student_id: "local-student-2", teacher_id: ids.teacher2, source: "student", rating: 5, comment: "Likes online class pace.", created_by: ids.reception, created_at: now },
  ],
  student_worker_feedback: [
    { id: "local-worker-feedback-1", student_id: "local-student-1", target_user_id: null, target_teacher_id: ids.teacher, target_role: "teacher", comment: "Teacher explained the speaking task clearly today.", created_at: now },
    { id: "local-worker-feedback-2", student_id: "local-student-2", target_user_id: ids.reception, target_teacher_id: null, target_role: "reception", comment: "Reception helped me reschedule politely.", created_at: now },
  ],
  employee_events: [
    { id: "local-event-1", user_id: ids.sales, teacher_id: null, type: "performance_note", event_date: today, amount: null, score: 86, notes: "Followed up with all hot leads.", created_by: ids.admin, created_at: now },
    { id: "local-event-2", user_id: null, teacher_id: ids.teacher, type: "vacation", event_date: today, amount: null, score: null, notes: "Approved half-day leave.", created_by: ids.admin, created_at: now },
  ],
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function withRelations(table: string, row: Row) {
  const item = { ...row };
  if (table === "classes") item.students = db.students.filter((student) => student.class_id === row.id);
  if (table === "student_account_records") {
    item.students = db.students.find((student) => student.id === row.student_id) ?? null;
    item.classes = db.classes.find((classRow) => classRow.id === row.class_id) ?? null;
    item.teachers = db.teachers.find((teacher) => teacher.id === row.teacher_id) ?? null;
    item.users = db.users.find((user) => user.id === row.received_by) ?? null;
  }
  if (table === "exam_records" || table === "feedback_records") {
    item.students = db.students.find((student) => student.id === row.student_id) ?? null;
    item.teachers = db.teachers.find((teacher) => teacher.id === row.teacher_id) ?? null;
  }
  if (table === "student_worker_feedback") {
    item.students = db.students.find((student) => student.id === row.student_id) ?? null;
    item.users = db.users.find((user) => user.id === row.target_user_id) ?? null;
    item.teachers = db.teachers.find((teacher) => teacher.id === row.target_teacher_id) ?? null;
  }
  if (table === "employee_events") {
    item.users = db.users.find((user) => user.id === row.user_id) ?? null;
    item.teachers = db.teachers.find((teacher) => teacher.id === row.teacher_id) ?? null;
  }
  if (table === "students") {
    const klass = db.classes.find((classRow) => classRow.id === row.class_id);
    item.classes = klass ? { ...klass, teachers: db.teachers.find((teacher) => teacher.id === klass.teacher_id) ?? null } : null;
  }
  if (table === "teacher_adjustments") item.teachers = db.teachers.find((teacher) => teacher.id === row.teacher_id) ?? null;
  if (table === "employee_adjustments") item.users = db.users.find((user) => user.id === row.user_id) ?? null;
  if (table === "leads") {
    item.lead_interactions = db.lead_interactions
      .filter((interaction) => interaction.lead_id === row.id)
      .map((interaction): Row => ({ ...interaction, users: db.users.find((user) => user.id === interaction.created_by) ?? null }))
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    item.users = db.users.find((user) => user.id === row.assigned_to) ?? null;
    item.lead_files = db.lead_files.find((file) => file.id === row.file_id) ?? null;
  }
  return item;
}

class LocalQuery {
  private filters: Array<(row: Row) => boolean> = [];
  private sortKey: string | null = null;
  private ascending = true;
  private singleRow = false;
  private head = false;
  private wantsCount = false;
  private operation: "select" | "insert" | "update" | "upsert" = "select";
  private payload: Row | Row[] | null = null;

  constructor(private table: string) {}

  select(_columns = "*", options?: { count?: string; head?: boolean }) {
    this.head = Boolean(options?.head);
    this.wantsCount = Boolean(options?.count);
    return this;
  }

  insert(payload: Row | Row[]) {
    this.operation = "insert";
    this.payload = payload;
    return this;
  }

  upsert(payload: Row | Row[]) {
    this.operation = "upsert";
    this.payload = payload;
    return this;
  }

  update(payload: Row) {
    this.operation = "update";
    this.payload = payload;
    return this;
  }

  eq(key: string, value: unknown) {
    this.filters.push((row) => row[key] === value);
    return this;
  }

  neq(key: string, value: unknown) {
    this.filters.push((row) => row[key] !== value);
    return this;
  }

  in(key: string, values: unknown[]) {
    this.filters.push((row) => values.includes(row[key]));
    return this;
  }

  gte(key: string, value: string) {
    this.filters.push((row) => String(row[key] ?? "") >= value);
    return this;
  }

  lte(key: string, value: string) {
    this.filters.push((row) => String(row[key] ?? "") <= value);
    return this;
  }

  order(key: string, options?: { ascending?: boolean }) {
    this.sortKey = key;
    this.ascending = options?.ascending ?? true;
    return this;
  }

  async single() {
    this.singleRow = true;
    return this.resolve();
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.resolve().then(onfulfilled, onrejected);
  }

  private matching() {
    let rows = db[this.table] ?? [];
    for (const filter of this.filters) rows = rows.filter(filter);
    if (this.sortKey) {
      rows = [...rows].sort((a, b) => String(a[this.sortKey!] ?? "").localeCompare(String(b[this.sortKey!] ?? "")));
      if (!this.ascending) rows.reverse();
    }
    return rows;
  }

  private async resolve(): Promise<Result> {
    db[this.table] ??= [];
    if (this.operation === "insert" || this.operation === "upsert") {
      const rows = (Array.isArray(this.payload) ? this.payload : [this.payload]).filter(Boolean).map((row) => ({
        id: row!.id ?? crypto.randomUUID(),
        created_at: row!.created_at ?? now,
        ...row,
      }));
      db[this.table].push(...rows);
      const data = this.singleRow ? withRelations(this.table, rows[0]) : rows.map((row) => withRelations(this.table, row));
      return { data: clone(data), error: null, count: rows.length };
    }
    if (this.operation === "update") {
      const rows = this.matching();
      rows.forEach((row) => Object.assign(row, this.payload));
      const data = this.singleRow ? rows[0] ?? null : rows;
      return { data: clone(data), error: null, count: rows.length };
    }
    const rows = this.matching().map((row) => withRelations(this.table, row));
    const data = this.head ? null : this.singleRow ? rows[0] ?? null : rows;
    return { data: clone(data), error: null, count: this.wantsCount ? rows.length : null };
  }
}

export function createLocalSupabaseClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: { id: ids.admin, email: "admin@local.test" } }, error: null }),
      signInWithPassword: async () => ({ data: { user: { id: ids.admin, email: "admin@local.test" } }, error: null }),
      signOut: async () => ({ error: null }),
      admin: {
        createUser: async ({ email }: { email: string }) => ({ data: { user: { id: crypto.randomUUID(), email } }, error: null }),
        updateUserById: async (id: string) => ({ data: { user: { id, email: "local-reset@local.test" } }, error: null }),
      },
    },
    from: (table: string) => new LocalQuery(table),
  };
}

export function localProfile(role: Role = "admin"): UserProfile {
  const byRole = db.users.find((user) => user.role === role) ?? db.users[0];
  return clone(byRole as UserProfile);
}

export const localUser = { id: ids.admin, email: "admin@local.test" };
