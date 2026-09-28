"use client";

import { useMemo, useState } from "react";
import { AtSign, Copy, KeyRound, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Role } from "@/lib/types";

type LeadFile = { id: string; name: string };
type Employee = {
  id: string;
  full_name: string;
  email?: string | null;
  role: Role;
  is_active: boolean;
  permissions: { sales_access?: boolean; assigned_files?: string[]; can_view_treasury?: boolean; can_view_payroll?: boolean } | null;
  payroll_type?: "monthly_salary" | "monthly_wage" | "hourly" | null;
  monthly_salary?: number | null;
  monthly_wage?: number | null;
  hourly_rate?: number | null;
};

export function EmployeeForm({ leadFiles, employees }: { leadFiles: LeadFile[]; employees: Employee[] }) {
  const [selected, setSelected] = useState<Employee | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("reception");
  const [active, setActive] = useState(true);
  const [salesAccess, setSalesAccess] = useState(false);
  const [canViewTreasury, setCanViewTreasury] = useState(false);
  const [canViewPayroll, setCanViewPayroll] = useState(false);
  const [assignedFiles, setAssignedFiles] = useState<string[]>([]);
  const [payrollType, setPayrollType] = useState<"monthly_salary" | "monthly_wage" | "hourly">("monthly_salary");
  const [monthlySalary, setMonthlySalary] = useState("0");
  const [monthlyWage, setMonthlyWage] = useState("0");
  const [hourlyRate, setHourlyRate] = useState("0");
  const [result, setResult] = useState("");
  const isEdit = Boolean(selected);

  const title = useMemo(() => (isEdit ? "Edit Employee" : "Create Employee"), [isEdit]);
  function generateAcademyEmail() {
    const localPart = fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") || "employee";
    setEmail(`${localPart}@fliessend-deutsch.local`);
  }
  function load(employee: Employee) {
    setSelected(employee);
    setFullName(employee.full_name);
    setEmail(employee.email ?? "");
    setRole(employee.role);
    setActive(employee.is_active);
    setSalesAccess(Boolean(employee.permissions?.sales_access));
    setCanViewTreasury(Boolean(employee.permissions?.can_view_treasury));
    setCanViewPayroll(Boolean(employee.permissions?.can_view_payroll));
    setAssignedFiles(employee.permissions?.assigned_files ?? []);
    setPayrollType(employee.payroll_type === "hourly" ? "hourly" : employee.payroll_type === "monthly_wage" ? "monthly_wage" : "monthly_salary");
    setMonthlySalary(String(employee.monthly_salary ?? 0));
    setMonthlyWage(String(employee.monthly_wage ?? 0));
    setHourlyRate(String(employee.hourly_rate ?? 0));
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/employees", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: selected?.id,
        full_name: fullName,
        email,
        role,
        is_active: active,
        permissions: {
          sales_access: role === "reception" ? salesAccess : false,
          assigned_files: role === "sales" ? assignedFiles : [],
          can_view_treasury: canViewTreasury,
          can_view_payroll: canViewPayroll,
        },
        payroll_type: payrollType,
        monthly_salary: Number(monthlySalary || 0),
        monthly_wage: Number(monthlyWage || 0),
        hourly_rate: Number(hourlyRate || 0),
      }),
    });
    const json = await response.json();
    setResult(response.ok ? `Temporary password: ${json.temporaryPassword ?? "updated"}` : json.error);
  }
  async function resetPassword() {
    if (!selected) return;
    const response = await fetch("/api/employees/reset-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: selected.id }) });
    const json = await response.json();
    setResult(response.ok ? `Temporary password: ${json.temporaryPassword}` : json.error);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <Card>
        <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <Input required placeholder="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
            <div className="flex gap-2"><Input className="min-w-0 flex-1" required type="email" placeholder="Academy email address" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isEdit} />{!isEdit && <Button type="button" variant="outline" title="Generate academy email" onClick={generateAcademyEmail}><AtSign size={16} /> Generate</Button>}</div>
            <Select value={role} onChange={(event) => { setRole(event.target.value as Role); setSalesAccess(false); setAssignedFiles([]); }}>
              <option value="reception">Reception</option><option value="sales">Sales</option><option value="teacher">Teacher</option><option value="admin">Admin</option>
            </Select>
            {role !== "teacher" && (
              <div className="space-y-3 rounded-md border p-3">
                <p className="text-sm font-medium">Payroll calculation</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <Select value={payrollType} onChange={(event) => setPayrollType(event.target.value as "monthly_salary" | "monthly_wage" | "hourly")} aria-label="Payroll type">
                    <option value="monthly_salary">Fixed monthly salary</option>
                    <option value="monthly_wage">Monthly wage</option>
                    <option value="hourly">Calculated per hour</option>
                  </Select>
                  {payrollType === "monthly_salary" && <Input type="number" min="0" step="0.01" placeholder="Monthly salary" value={monthlySalary} onChange={(event) => setMonthlySalary(event.target.value)} />}
                  {payrollType === "monthly_wage" && <Input type="number" min="0" step="0.01" placeholder="Monthly wage" value={monthlyWage} onChange={(event) => setMonthlyWage(event.target.value)} />}
                  {payrollType === "hourly" && <Input type="number" min="0" step="0.01" placeholder="Rate per hour" value={hourlyRate} onChange={(event) => setHourlyRate(event.target.value)} />}
                </div>
                {payrollType === "hourly" && <p className="text-xs text-muted-foreground">Payroll will use Check in hours x hourly rate, then apply bonuses/deductions.</p>}
              </div>
            )}
            <div className="space-y-3 rounded-md border p-3">
              <p className="text-sm font-medium">Permissions checklist</p>
              {role === "admin" ? (
                <p className="text-sm text-muted-foreground">Admin has full access automatically.</p>
              ) : (
                <>
                  {role === "reception" && <label className="flex items-center gap-2 text-sm"><input checked={salesAccess} type="checkbox" onChange={(e) => setSalesAccess(e.target.checked)} /> Can view assigned sales leads</label>}
                  {role === "sales" && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Lead Files Access</p>
                      {leadFiles.map((file) => (
                        <label key={file.id} className="flex items-center gap-2 text-sm">
                          <input checked={assignedFiles.includes(file.id)} type="checkbox" onChange={(e) => setAssignedFiles((files) => e.target.checked ? [...files, file.id] : files.filter((id) => id !== file.id))} />
                          {file.name}
                        </label>
                      ))}
                      {!leadFiles.length && <p className="text-sm text-muted-foreground">No lead files uploaded yet.</p>}
                    </div>
                  )}
                  {role === "teacher" && <p className="text-sm text-muted-foreground">Teacher access is automatically scoped to their own classes and students.</p>}
                  <label className="flex items-center gap-2 text-sm"><input checked={canViewTreasury} type="checkbox" onChange={(e) => setCanViewTreasury(e.target.checked)} /> Can view treasury reports</label>
                  <label className="flex items-center gap-2 text-sm"><input checked={canViewPayroll} type="checkbox" onChange={(e) => setCanViewPayroll(e.target.checked)} /> Can view payroll reports</label>
                </>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm"><input checked={active} type="checkbox" onChange={(e) => setActive(e.target.checked)} /> Active</label>
            <div className="flex flex-wrap gap-2">
              <Button><UserPlus size={16} /> {isEdit ? "Update Permissions" : "Create Employee & Send Login"}</Button>
              {isEdit && <Button type="button" variant="outline" onClick={resetPassword}><KeyRound size={16} /> Reset Password</Button>}
            </div>
            {result && <div className="flex items-center justify-between rounded-md bg-muted p-3 text-sm"><span>{result}</span><Button type="button" variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(result.replace("Temporary password: ", ""))}><Copy size={16} /></Button></div>}
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Employees</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {employees.map((employee) => (
            <button key={employee.id} className="w-full rounded-md border p-3 text-left text-sm hover:bg-muted" onClick={() => load(employee)}>
              <span className="font-medium">{employee.full_name}</span>
              <span className="ml-2 text-muted-foreground">{employee.email ?? "no email"} · {employee.role} · {employee.is_active ? "active" : "inactive"}</span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
