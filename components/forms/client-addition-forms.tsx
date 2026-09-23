"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Option = { id: string; name?: string; full_name?: string };

function label(option: Option) {
  return option.name ?? option.full_name ?? option.id;
}

export function BranchForm() {
  const [saved, setSaved] = useState("");
  async function submit(form: FormData) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("branches").insert({
      name: form.get("name"),
      address: form.get("address"),
      phone: form.get("phone"),
      is_active: true,
    });
    setSaved(error?.message ?? "Branch saved");
  }
  return (
    <Card>
      <CardHeader><CardTitle>Add Branch</CardTitle></CardHeader>
      <CardContent>
        <form action={submit} className="grid gap-3 md:grid-cols-4">
          <Input name="name" required placeholder="Branch name" />
          <Input name="address" placeholder="Address" />
          <Input name="phone" placeholder="Phone" />
          <Button><Plus size={16} /> Save Branch</Button>
          {saved && <p className="text-sm text-muted-foreground md:col-span-4">{saved}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

export function AccountRecordForm({ students, classes, teachers, users }: { students: Option[]; classes: Option[]; teachers: Option[]; users: Option[] }) {
  const [saved, setSaved] = useState("");
  async function submit(form: FormData) {
    const supabase = createSupabaseBrowserClient();
    const paidAt = form.get("status") === "paid" ? new Date().toISOString() : null;
    const { error } = await supabase.from("student_account_records").insert({
      student_id: form.get("student_id"),
      class_id: form.get("class_id") || null,
      teacher_id: form.get("teacher_id") || null,
      received_by: form.get("received_by") || null,
      amount: Number(form.get("amount") || 0),
      due_date: form.get("due_date") || null,
      paid_at: paidAt,
      status: form.get("status"),
      notes: form.get("notes"),
      receipt_no: form.get("receipt_no") || `FD-${Date.now()}`,
    });
    setSaved(error?.message ?? "Account record saved");
  }
  return (
    <Card>
      <CardHeader><CardTitle>Student Account Entry</CardTitle></CardHeader>
      <CardContent>
        <form action={submit} className="grid gap-3 md:grid-cols-4">
          <Select name="student_id" required>{students.map((item) => <option key={item.id} value={item.id}>{label(item)}</option>)}</Select>
          <Input name="amount" required type="number" step="0.01" placeholder="Amount" />
          <Select name="received_by"><option value="">Received by...</option>{users.map((item) => <option key={item.id} value={item.id}>{label(item)}</option>)}</Select>
          <Select name="teacher_id"><option value="">Lecturer...</option>{teachers.map((item) => <option key={item.id} value={item.id}>{label(item)}</option>)}</Select>
          <Select name="class_id"><option value="">Course / class...</option>{classes.map((item) => <option key={item.id} value={item.id}>{label(item)}</option>)}</Select>
          <Input name="due_date" type="date" aria-label="When will pay" />
          <Select name="status" defaultValue="scheduled"><option value="paid">Paid</option><option value="scheduled">Scheduled</option><option value="due">Due</option><option value="overdue">Overdue</option></Select>
          <Input name="receipt_no" placeholder="Receipt no. optional" />
          <Textarea name="notes" className="md:col-span-4" placeholder="Notes: who received, when they will pay, agreement details..." />
          <Button className="md:col-span-4"><Plus size={16} /> Save Account Entry</Button>
          {saved && <p className="text-sm text-muted-foreground md:col-span-4">{saved}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

export function ExamRecordForm({ students }: { students: Option[] }) {
  const [saved, setSaved] = useState("");
  async function submit(form: FormData) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("exam_records").insert({
      student_id: form.get("student_id") || null,
      exam_type: form.get("exam_type"),
      scheduled_at: form.get("scheduled_at"),
      level_result: form.get("level_result"),
      score_percent: form.get("score_percent") ? Number(form.get("score_percent")) : null,
      result_comment: form.get("result_comment"),
    });
    setSaved(error?.message ?? "Exam record saved");
  }
  return (
    <Card>
      <CardHeader><CardTitle>Exam / Placement Booking</CardTitle></CardHeader>
      <CardContent>
        <form action={submit} className="grid gap-3 md:grid-cols-4">
          <Select name="student_id"><option value="">No student yet</option>{students.map((item) => <option key={item.id} value={item.id}>{label(item)}</option>)}</Select>
          <Select name="exam_type" defaultValue="placement"><option value="placement">Placement test</option><option value="osd">ÖSD exam</option><option value="internal">Internal exam</option></Select>
          <Input name="scheduled_at" type="datetime-local" required />
          <Input name="level_result" placeholder="Level result, e.g. A2" />
          <Input name="score_percent" type="number" min="0" max="100" step="0.01" placeholder="Score %" />
          <Textarea name="result_comment" className="md:col-span-3" placeholder="Result comment..." />
          <Button className="md:col-span-4"><Plus size={16} /> Save Exam</Button>
          {saved && <p className="text-sm text-muted-foreground md:col-span-4">{saved}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

export function FeedbackRecordForm({ students, teachers }: { students: Option[]; teachers: Option[] }) {
  const [saved, setSaved] = useState("");
  async function submit(form: FormData) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("feedback_records").insert({
      student_id: form.get("student_id"),
      teacher_id: form.get("teacher_id") || null,
      source: form.get("source"),
      rating: form.get("rating") ? Number(form.get("rating")) : null,
      comment: form.get("comment"),
    });
    setSaved(error?.message ?? "Feedback saved");
  }
  return (
    <Card>
      <CardHeader><CardTitle>Student / Teacher Feedback</CardTitle></CardHeader>
      <CardContent>
        <form action={submit} className="grid gap-3 md:grid-cols-4">
          <Select name="student_id" required>{students.map((item) => <option key={item.id} value={item.id}>{label(item)}</option>)}</Select>
          <Select name="teacher_id"><option value="">Teacher...</option>{teachers.map((item) => <option key={item.id} value={item.id}>{label(item)}</option>)}</Select>
          <Select name="source" defaultValue="teacher"><option value="teacher">Teacher feedback on student</option><option value="student">Student feedback</option></Select>
          <Input name="rating" type="number" min="1" max="5" placeholder="Rating 1-5" />
          <Textarea name="comment" required className="md:col-span-4" placeholder="Feedback comment..." />
          <Button className="md:col-span-4"><Plus size={16} /> Save Feedback</Button>
          {saved && <p className="text-sm text-muted-foreground md:col-span-4">{saved}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

export function EmployeeEventForm({ users, teachers }: { users: Option[]; teachers: Option[] }) {
  const [saved, setSaved] = useState("");
  async function submit(form: FormData) {
    const supabase = createSupabaseBrowserClient();
    const target = String(form.get("target") ?? "");
    const [kind, id] = target.split(":");
    const { error } = await supabase.from("employee_events").insert({
      user_id: kind === "user" ? id : null,
      teacher_id: kind === "teacher" ? id : null,
      type: form.get("type"),
      event_date: form.get("event_date"),
      amount: form.get("amount") ? Number(form.get("amount")) : null,
      score: form.get("score") ? Number(form.get("score")) : null,
      notes: form.get("notes"),
    });
    setSaved(error?.message ?? "HR event saved");
  }
  return (
    <Card>
      <CardHeader><CardTitle>Vacation / Penalty / Performance</CardTitle></CardHeader>
      <CardContent>
        <form action={submit} className="grid gap-3 md:grid-cols-4">
          <Select name="target" required>
            {users.map((item) => <option key={`user:${item.id}`} value={`user:${item.id}`}>{label(item)}</option>)}
            {teachers.map((item) => <option key={`teacher:${item.id}`} value={`teacher:${item.id}`}>{label(item)} - teacher</option>)}
          </Select>
          <Select name="type" defaultValue="performance_note"><option value="vacation">Vacation</option><option value="penalty">Penalty</option><option value="performance_note">Performance note</option></Select>
          <Input name="event_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          <Input name="amount" type="number" step="0.01" placeholder="Amount if penalty" />
          <Input name="score" type="number" min="0" max="100" placeholder="Performance score" />
          <Textarea name="notes" required className="md:col-span-3" placeholder="Notes..." />
          <Button className="md:col-span-4"><Plus size={16} /> Save HR Event</Button>
          {saved && <p className="text-sm text-muted-foreground md:col-span-4">{saved}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
