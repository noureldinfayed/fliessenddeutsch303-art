"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Option = { id: string; name: string };

export function StudentForm({ classes }: { classes: Option[] }) {
  const [saved, setSaved] = useState("");
  async function submit(form: FormData) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("students").insert({
      full_name: form.get("full_name"),
      phone: form.get("phone"),
      email: form.get("email"),
      level: form.get("level"),
      class_id: form.get("class_id") || null,
      total_price: Number(form.get("total_price") || 0),
      amount_paid: Number(form.get("amount_paid") || 0),
      payment_due_date: form.get("payment_due_date") || null,
      payment_comment: form.get("payment_comment"),
      status: form.get("status"),
      enrolled_at: new Date().toISOString(),
    });
    setSaved(error?.message ?? "Student saved");
  }
  return (
    <Card><CardHeader><CardTitle>Add Student</CardTitle></CardHeader><CardContent>
      <form action={submit} className="grid gap-3 md:grid-cols-3">
        <Input name="full_name" required placeholder="Full name" /><Input name="phone" required placeholder="Phone" /><Input name="email" type="email" placeholder="Email" />
        <Input name="level" placeholder="Level" /><Select name="class_id"><option value="">No class</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        <Select name="status" defaultValue="active"><option value="active">Active</option><option value="inactive">Inactive</option><option value="graduated">Graduated</option></Select>
        <Input name="total_price" type="number" min="0" step="0.01" placeholder="Total price" />
        <Input name="amount_paid" type="number" min="0" step="0.01" placeholder="Amount paid" />
        <Input name="payment_due_date" type="date" aria-label="Payment date arranged" />
        <Textarea className="md:col-span-3" name="payment_comment" placeholder="Payment comment or arrangement notes..." />
        <Button className="md:col-span-3">Save Student</Button>{saved && <p className="text-sm text-muted-foreground">{saved}</p>}
      </form>
    </CardContent></Card>
  );
}

export function ClassForm({ teachers }: { teachers: Option[] }) {
  const [saved, setSaved] = useState("");
  async function submit(form: FormData) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("classes").insert({ name: form.get("name"), teacher_id: form.get("teacher_id"), schedule: form.get("schedule"), capacity: Number(form.get("capacity")) });
    setSaved(error?.message ?? "Class saved");
  }
  return (
    <Card><CardHeader><CardTitle>Create Class</CardTitle></CardHeader><CardContent>
      <form action={submit} className="grid gap-3 md:grid-cols-4">
        <Input name="name" required placeholder="Class name" /><Select name="teacher_id" required>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>
        <Input name="schedule" required placeholder="Sunday Tuesday 6pm" /><Input name="capacity" required type="number" min="1" placeholder="Capacity" />
        <Button className="md:col-span-4">Save Class</Button>{saved && <p className="text-sm text-muted-foreground">{saved}</p>}
      </form>
    </CardContent></Card>
  );
}

export function TreasuryForm() {
  const [saved, setSaved] = useState("");
  async function submit(form: FormData) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("treasury_records").insert({ type: form.get("type"), amount: Number(form.get("amount")), category: form.get("category"), description: form.get("description"), date: form.get("date") });
    setSaved(error?.message ?? "Record saved");
  }
  return (
    <Card><CardHeader><CardTitle>Add Income or Expense</CardTitle></CardHeader><CardContent>
      <form action={submit} className="grid gap-3 md:grid-cols-5">
        <Select name="type" defaultValue="income"><option value="income">Income</option><option value="expense">Expense</option></Select><Input name="amount" type="number" step="0.01" required placeholder="Amount" />
        <Input name="category" required placeholder="Category" /><Input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        <Input name="description" placeholder="Description" /><Button className="md:col-span-5">Save Record</Button>{saved && <p className="text-sm text-muted-foreground">{saved}</p>}
      </form>
    </CardContent></Card>
  );
}

export function AdjustmentForm({ teachers }: { teachers: Option[] }) {
  const [saved, setSaved] = useState("");
  async function submit(form: FormData) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("teacher_adjustments").insert({ teacher_id: form.get("teacher_id"), type: form.get("type"), amount: Number(form.get("amount")), reason: form.get("reason"), period_start: form.get("period_start"), period_end: form.get("period_end") });
    setSaved(error?.message ?? "Adjustment saved");
  }
  return (
    <Card><CardHeader><CardTitle>Add Adjustment</CardTitle></CardHeader><CardContent>
      <form action={submit} className="grid gap-3 md:grid-cols-3">
        <Select name="teacher_id">{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select><Select name="type"><option value="bonus">Bonus</option><option value="deduction">Deduction</option></Select><Input name="amount" required type="number" />
        <Input name="period_start" required type="date" /><Input name="period_end" required type="date" /><Textarea name="reason" required placeholder="Reason" />
        <Button className="md:col-span-3">Save Adjustment</Button>{saved && <p className="text-sm text-muted-foreground">{saved}</p>}
      </form>
    </CardContent></Card>
  );
}
