"use client";

import { useState } from "react";
import { Edit2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StudentExcelTools } from "@/components/forms/student-excel-tools";
import { StudentsTable } from "@/components/tables/students-table";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ClassOption = { id: string; name: string };
type StudentRow = {
  id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  level?: string | null;
  tags?: string[] | null;
  class_id?: string | null;
  learning_mode?: "online" | "offline" | string | null;
  status: string;
  total_price?: number | null;
  amount_paid?: number | null;
  payment_due_date?: string | null;
  payment_comment?: string | null;
  enrolled_at?: string | null;
  created_at?: string | null;
  classes?: { name?: string; teachers?: { name?: string } | null } | null;
};

const blank = {
  full_name: "",
  phone: "",
  email: "",
  level: "",
  tags: "",
  class_id: "",
  learning_mode: "offline",
  status: "active",
  total_price: "0",
  amount_paid: "0",
  payment_due_date: "",
  payment_comment: "",
};

export function StudentManager({ initialStudents, classes }: { initialStudents: StudentRow[]; classes: ClassOption[] }) {
  const [students, setStudents] = useState(initialStudents);
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [form, setForm] = useState(blank);
  const [saved, setSaved] = useState("");

  function setField(key: keyof typeof blank, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function reset() {
    setEditing(null);
    setForm(blank);
    setSaved("");
  }

  function startEdit(student: StudentRow) {
    setEditing(student);
    setForm({
      full_name: student.full_name ?? "",
      phone: student.phone ?? "",
      email: student.email ?? "",
      level: student.level ?? "",
      tags: (student.tags ?? []).join(", "),
      class_id: student.class_id ?? "",
      learning_mode: student.learning_mode === "online" ? "online" : "offline",
      status: student.status ?? "active",
      total_price: String(student.total_price ?? 0),
      amount_paid: String(student.amount_paid ?? 0),
      payment_due_date: student.payment_due_date ?? "",
      payment_comment: student.payment_comment ?? "",
    });
    setSaved("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      full_name: form.full_name,
      phone: form.phone,
      email: form.email,
      level: form.level,
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      class_id: form.class_id || null,
      learning_mode: form.learning_mode,
      status: form.status,
      total_price: Number(form.total_price || 0),
      amount_paid: Number(form.amount_paid || 0),
      payment_due_date: form.payment_due_date || null,
      payment_comment: form.payment_comment,
    };
    const supabase = createSupabaseBrowserClient();
    if (editing) {
      const { error } = await supabase.from("students").update(payload).eq("id", editing.id);
      if (error) {
        setSaved(error.message);
        return;
      }
      setStudents((rows) => rows.map((row) => row.id === editing.id ? { ...row, ...payload, classes: classes.find((klass) => klass.id === payload.class_id) ?? null } : row));
      setSaved("Student updated");
      return;
    }

    const { data, error } = await supabase.from("students").insert({ ...payload, enrolled_at: new Date().toISOString() }).select("id").single();
    if (error) {
      setSaved(error.message);
      return;
    }
    setStudents((rows) => [{ id: data.id, ...payload, enrolled_at: new Date().toISOString(), classes: classes.find((klass) => klass.id === payload.class_id) ?? null }, ...rows]);
    setSaved("Student saved");
    reset();
  }

  return (
    <div className="space-y-6">
      <StudentExcelTools rows={students as unknown as Record<string, unknown>[]} classes={classes} />
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>{editing ? "Edit Student" : "Add Student"}</CardTitle>
          {editing && <Button type="button" variant="outline" size="sm" onClick={reset}><X size={16} /> Cancel</Button>}
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-3">
            <Input required placeholder="Full name" value={form.full_name} onChange={(event) => setField("full_name", event.target.value)} />
            <Input required placeholder="Phone" value={form.phone} onChange={(event) => setField("phone", event.target.value)} />
            <Input type="email" placeholder="Email" value={form.email} onChange={(event) => setField("email", event.target.value)} />
            <Input placeholder="Level" value={form.level} onChange={(event) => setField("level", event.target.value)} />
            <Input placeholder="Tags, e.g. electric company, water company" value={form.tags} onChange={(event) => setField("tags", event.target.value)} />
            <Select value={form.class_id} onChange={(event) => setField("class_id", event.target.value)}>
              <option value="">No class</option>
              {classes.map((klass) => <option key={klass.id} value={klass.id}>{klass.name}</option>)}
            </Select>
            <Select value={form.learning_mode} onChange={(event) => setField("learning_mode", event.target.value)}>
              <option value="offline">Offline</option>
              <option value="online">Online</option>
            </Select>
            <Select value={form.status} onChange={(event) => setField("status", event.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
            </Select>
            <Input type="number" min="0" step="0.01" placeholder="Total price" value={form.total_price} onChange={(event) => setField("total_price", event.target.value)} />
            <Input type="number" min="0" step="0.01" placeholder="Amount paid" value={form.amount_paid} onChange={(event) => setField("amount_paid", event.target.value)} />
            <Input type="date" aria-label="Payment date arranged" value={form.payment_due_date} onChange={(event) => setField("payment_due_date", event.target.value)} />
            <Textarea className="md:col-span-3" placeholder="Payment comment or arrangement notes..." value={form.payment_comment} onChange={(event) => setField("payment_comment", event.target.value)} />
            <Button className="md:col-span-3">{editing ? <Edit2 size={16} /> : <Plus size={16} />}{editing ? "Update Student" : "Save Student"}</Button>
            {saved && <p className="text-sm text-muted-foreground md:col-span-3">{saved}</p>}
          </form>
        </CardContent>
      </Card>
      <StudentsTable rows={students as unknown as Record<string, unknown>[]} onEdit={(row) => startEdit(row as unknown as StudentRow)} />
    </div>
  );
}
