"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Edit2, Plus, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ClassExcelTools } from "@/components/forms/class-excel-tools";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Teacher = { id: string; name: string };
type ClassStudent = { id: string; full_name: string; phone?: string | null; email?: string | null; level?: string | null; learning_mode?: string | null; status?: string | null };
type ClassRow = {
  id: string;
  name: string;
  teacher_id?: string | null;
  level?: string | null;
  learning_mode?: string | null;
  schedule: string;
  capacity: number;
  teachers?: { name: string } | null;
  students?: ClassStudent[];
};

const weekDays = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function ClassManager({ initialClasses, teachers }: { initialClasses: ClassRow[]; teachers: Teacher[] }) {
  const [classes, setClasses] = useState(initialClasses);
  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? "");
  const [level, setLevel] = useState("");
  const [learningMode, setLearningMode] = useState("offline");
  const [scheduleDays, setScheduleDays] = useState<string[]>([]);
  const [scheduleTime, setScheduleTime] = useState("");
  const [capacity, setCapacity] = useState("12");
  const [saved, setSaved] = useState("");
  const [openClassIds, setOpenClassIds] = useState<string[]>([]);

  const title = editing ? "Edit Class" : "Create Class";
  const buttonLabel = editing ? "Update Class" : "Save Class";

  function reset() {
    setEditing(null);
    setName("");
    setTeacherId(teachers[0]?.id ?? "");
    setLevel("");
    setLearningMode("offline");
    setScheduleDays([]);
    setScheduleTime("");
    setCapacity("12");
    setSaved("");
  }

  function startEdit(row: ClassRow) {
    setEditing(row);
    setName(row.name);
    setTeacherId(row.teacher_id ?? teachers[0]?.id ?? "");
    setLevel(row.level ?? "");
    setLearningMode(row.learning_mode === "online" ? "online" : "offline");
    setScheduleDays(weekDays.filter((day) => row.schedule.includes(day)));
    setScheduleTime(row.schedule.replace(weekDays.filter((day) => row.schedule.includes(day)).join(" "), "").trim());
    setCapacity(String(row.capacity));
    setSaved("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const schedule = `${scheduleDays.join(" ")} ${scheduleTime}`.trim();
    const payload = { name, teacher_id: teacherId || null, level, learning_mode: learningMode, schedule, capacity: Number(capacity) };
    const supabase = createSupabaseBrowserClient();
    if (editing) {
      const { error } = await supabase.from("classes").update(payload).eq("id", editing.id);
      if (error) {
        setSaved(error.message);
        return;
      }
      setClasses((rows) => rows.map((row) => row.id === editing.id ? { ...row, ...payload, teachers: teachers.find((teacher) => teacher.id === teacherId) ?? null } : row));
      setSaved("Class updated");
      setEditing((current) => current ? { ...current, ...payload } : current);
      return;
    }

    const { data, error } = await supabase.from("classes").insert(payload).select("id,name,teacher_id,level,learning_mode,schedule,capacity").single();
    if (error) {
      setSaved(error.message);
      return;
    }
    const created = {
      id: data.id,
      name: data.name,
      teacher_id: data.teacher_id,
      level: data.level,
      learning_mode: data.learning_mode,
      schedule: data.schedule,
      capacity: data.capacity,
      teachers: teachers.find((teacher) => teacher.id === data.teacher_id) ?? null,
      students: [],
    };
    setClasses((rows) => [created, ...rows]);
    setSaved("Class saved");
    reset();
  }

  const tableRows = useMemo(
    () => classes.map((row) => ({ ...row, teacher: row.teachers?.name ?? teachers.find((teacher) => teacher.id === row.teacher_id)?.name ?? "Unassigned" })),
    [classes, teachers],
  );

  function toggleDay(day: string) {
    setScheduleDays((days) => days.includes(day) ? days.filter((item) => item !== day) : [...days, day]);
  }

  function toggleClass(id: string) {
    setOpenClassIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  }

  function printRoster(row: ClassRow & { teacher: string }) {
    const students = row.students ?? [];
    const rosterRows = students.map((student, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${student.full_name}</td>
        <td>${student.phone ?? ""}</td>
        <td>${student.email ?? ""}</td>
        <td>${student.level ?? ""}</td>
        <td>${student.learning_mode ?? ""}</td>
        <td>${student.status ?? ""}</td>
      </tr>
    `).join("");
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${row.name} roster</title>
          <style>
            body { font-family: Inter, Arial, sans-serif; color: #0b0b0b; padding: 24px; }
            h1 { margin: 0 0 8px; font-size: 24px; }
            p { margin: 4px 0; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; font-size: 13px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f7f4ef; }
            .meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 24px; margin-top: 12px; }
          </style>
        </head>
        <body>
          <h1>${row.name}</h1>
          <div class="meta">
            <p><strong>Level:</strong> ${row.level ?? ""}</p>
            <p><strong>Teacher:</strong> ${row.teacher}</p>
            <p><strong>Mode:</strong> ${row.learning_mode ?? ""}</p>
            <p><strong>Schedule:</strong> ${row.schedule ?? ""}</p>
            <p><strong>Capacity:</strong> ${row.capacity}</p>
            <p><strong>Students:</strong> ${students.length}</p>
          </div>
          <table>
            <thead><tr><th>#</th><th>Name</th><th>Phone</th><th>Email</th><th>Level</th><th>Mode</th><th>Status</th></tr></thead>
            <tbody>${rosterRows || `<tr><td colspan="7">No students in this class yet.</td></tr>`}</tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <div className="space-y-6">
      <ClassExcelTools rows={classes as unknown as Record<string, unknown>[]} teachers={teachers} />
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          {editing && (
            <Button type="button" variant="outline" size="sm" onClick={reset}>
              <X size={16} /> Cancel
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-4">
            <Input required placeholder="Class name" value={name} onChange={(event) => setName(event.target.value)} />
            <Select required value={teacherId} onChange={(event) => setTeacherId(event.target.value)}>
              {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
            </Select>
            <Input placeholder="Level" value={level} onChange={(event) => setLevel(event.target.value)} />
            <Select value={learningMode} onChange={(event) => setLearningMode(event.target.value)}>
              <option value="offline">Offline</option>
              <option value="online">Online</option>
            </Select>
            <div className="grid gap-2 md:col-span-4">
              <p className="text-sm font-medium">Weekly schedule</p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-7">
                {weekDays.map((day) => (
                  <Button key={day} type="button" variant={scheduleDays.includes(day) ? "default" : "outline"} onClick={() => toggleDay(day)}>
                    {day.slice(0, 3)}
                  </Button>
                ))}
              </div>
            </div>
            <Input required placeholder="Time, e.g. 18:00" value={scheduleTime} onChange={(event) => setScheduleTime(event.target.value)} />
            <Input required type="number" min="1" placeholder="Capacity" value={capacity} onChange={(event) => setCapacity(event.target.value)} />
            <Button className="md:col-span-4" disabled={!scheduleDays.length || !scheduleTime}>
              {editing ? <Edit2 size={16} /> : <Plus size={16} />}
              {buttonLabel}
            </Button>
            {saved && <p className="text-sm text-muted-foreground md:col-span-4">{saved}</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Created Classes</CardTitle></CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-muted">
              <tr>
                {["", "Name", "Level", "Online / Offline", "Teacher", "Schedule", "Capacity", "Students", "Actions"].map((header) => (
                  <th key={header} className="px-4 py-3 text-left font-semibold">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => {
                const isOpen = openClassIds.includes(row.id);
                const students = row.students ?? [];
                return (
                  <Fragment key={row.id}>
                    <tr key={row.id} className="border-t">
                      <td className="px-4 py-3">
                        <Button type="button" size="icon" variant="ghost" onClick={() => toggleClass(row.id)} aria-label={`Open ${row.name}`}>
                          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </Button>
                      </td>
                      <td className="px-4 py-3 font-semibold">{row.name}</td>
                      <td className="px-4 py-3">{row.level}</td>
                      <td className="px-4 py-3">{row.learning_mode}</td>
                      <td className="px-4 py-3">{row.teacher}</td>
                      <td className="px-4 py-3">{row.schedule}</td>
                      <td className="px-4 py-3">{row.capacity}</td>
                      <td className="px-4 py-3">{students.length}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => startEdit(row)}><Edit2 size={16} /> Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => printRoster(row)}><Printer size={16} /> Print List</Button>
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${row.id}-students`} className="border-t bg-white">
                        <td colSpan={9} className="p-4">
                          <div className="rounded-md border">
                            <table className="w-full text-sm">
                              <thead className="bg-muted">
                                <tr>
                                  {["Name", "Phone", "Email", "Level", "Mode", "Status"].map((header) => (
                                    <th key={header} className="px-3 py-2 text-left font-semibold">{header}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {students.map((student) => (
                                  <tr key={student.id} className="border-t">
                                    <td className="px-3 py-2 font-medium">{student.full_name}</td>
                                    <td className="px-3 py-2">{student.phone}</td>
                                    <td className="px-3 py-2">{student.email}</td>
                                    <td className="px-3 py-2">{student.level}</td>
                                    <td className="px-3 py-2">{student.learning_mode}</td>
                                    <td className="px-3 py-2">{student.status}</td>
                                  </tr>
                                ))}
                                {!students.length && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No students in this class yet.</td></tr>}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
