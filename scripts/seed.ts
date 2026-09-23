import { createClient } from "@supabase/supabase-js";
import { tempPassword } from "../lib/utils";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running seed.");

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function employee(email: string, full_name: string, role: string, permissions = {}) {
  const password = tempPassword();
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  await supabase.from("users").insert({ id: data.user.id, full_name, role, permissions });
  console.log(`${role}: ${email} / ${password}`);
  return data.user.id;
}

async function main() {
  const admin = await employee("admin@fliessend-deutsch.com", "Admin User", "admin");
  const sales1 = await employee("sales1@fliessend-deutsch.com", "Sales Rep One", "sales");
  const sales2 = await employee("sales2@fliessend-deutsch.com", "Sales Rep Two", "sales");
  const rec1 = await employee("reception1@fliessend-deutsch.com", "Reception One", "reception");
  await employee("reception2@fliessend-deutsch.com", "Reception Two", "reception");
  const tUsers = [
    await employee("teacher1@fliessend-deutsch.com", "Teacher One", "teacher"),
    await employee("teacher2@fliessend-deutsch.com", "Teacher Two", "teacher"),
    await employee("teacher3@fliessend-deutsch.com", "Teacher Three", "teacher"),
  ];
  const { data: teachers } = await supabase.from("teachers").insert([
    { user_id: tUsers[0], name: "Teacher One", phone: "01000000001", pay_type: "hourly", base_rate: 250 },
    { user_id: tUsers[1], name: "Teacher Two", phone: "01000000002", pay_type: "per_session", base_rate: 400 },
    { user_id: tUsers[2], name: "Teacher Three", phone: "01000000003", pay_type: "fixed", base_rate: 18000 },
  ]).select();
  const { data: classes } = await supabase.from("classes").insert([
    { name: "A1 Evening", teacher_id: teachers![0].id, level: "A1", learning_mode: "offline", schedule: "Sunday Tuesday 18:00", capacity: 16 },
    { name: "B1 Morning", teacher_id: teachers![1].id, level: "B1", learning_mode: "online", schedule: "Monday Wednesday 10:00", capacity: 14 },
  ]).select();
  await supabase.from("students").insert(Array.from({ length: 10 }, (_, index) => ({
    full_name: `Student ${index + 1}`,
    phone: `0101000000${index}`,
    email: `student${index + 1}@example.com`,
    level: index < 5 ? "A1" : "B1",
    tags: index % 2 === 0 ? ["electric company"] : ["water company"],
    class_id: classes![index % 2].id,
    learning_mode: index % 2 === 0 ? "offline" : "online",
    total_price: 8500,
    amount_paid: index % 3 === 0 ? 3000 : 8500,
    payment_due_date: index % 3 === 0 ? new Date(Date.now() + (index === 0 ? -1 : 1) * 86400000).toISOString().slice(0, 10) : null,
    payment_comment: index % 3 === 0 ? "Arranged remaining payment with student." : "",
    status: "active",
    enrolled_at: new Date().toISOString(),
  })));
  const { data: files } = await supabase.from("lead_files").insert([
    { name: "September Facebook", uploaded_by: admin, total_leads: 10 },
    { name: "Website Enquiries", uploaded_by: admin, total_leads: 10 },
  ]).select();
  await supabase.from("users").update({ permissions: { assigned_files: [files![0].id] } }).eq("id", sales1);
  await supabase.from("users").update({ permissions: { assigned_files: [files![1].id] } }).eq("id", sales2);
  await supabase.from("leads").insert(files!.flatMap((file, fileIndex) => Array.from({ length: 10 }, (_, index) => ({
    full_name: `Lead ${fileIndex + 1}-${index + 1}`, phone: `01020000${fileIndex}${index}`, source: file.name, file_id: file.id, assigned_to: fileIndex === 0 ? sales1 : sales2, status: "new",
  }))));
  await supabase.from("treasury_records").insert([
    { type: "income", amount: 12000, category: "Tuition", description: "Course payments", date: new Date().toISOString().slice(0, 10), created_by: admin },
    { type: "expense", amount: 2500, category: "Rent", description: "Classroom rent", date: new Date().toISOString().slice(0, 10), created_by: admin },
  ]);
  await supabase.from("teacher_attendance").insert([{ teacher_id: teachers![0].id, date: new Date().toISOString().slice(0, 10), check_in: "10:00", check_out: "14:00", sessions_count: 0, recorded_by: rec1 }]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
