import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Logo } from "@/components/layout/logo";
import { hasSupabaseEnv } from "@/lib/env";
import { dictionaries, direction, type Lang } from "@/lib/i18n";
import type { NavItem, UserProfile } from "@/lib/types";

const nav: Record<string, Array<NavItem & { labelKey: keyof typeof dictionaries.en.nav }>> = {
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", labelKey: "dashboard" },
    { href: "/admin/students", label: "Students", labelKey: "students" },
    { href: "/admin/classes", label: "Classes", labelKey: "classes" },
    { href: "/reception/attendance/students", label: "Student Attendance", labelKey: "studentAttendance" },
    { href: "/admin/exams", label: "Student Follow Up", labelKey: "exams" },
    { href: "/admin/exams-management", label: "Exams", labelKey: "examManagement" },
    { href: "/admin/accounts", label: "Accounts", labelKey: "accounts" },
    { href: "/admin/textbooks", label: "Textbook inventory", labelKey: "textbookInventory" },
    { href: "/admin/hr/attendance", label: "HR", labelKey: "hr" },
    { href: "/admin/hr/performance", label: "HR Performance", labelKey: "performance" },
    { href: "/admin/users", label: "Users", labelKey: "users" },
    { href: "/admin/logs", label: "Logs", labelKey: "logs" },
    { href: "/admin/sales", label: "Sales", labelKey: "sales" },
    { href: "/admin/treasury", label: "Treasury", labelKey: "treasury" },
    { href: "/admin/reports", label: "Reports", labelKey: "reports" },
    { href: "/admin/branches", label: "Branches", labelKey: "branches" },
  ],
  reception: [
    { href: "/reception/attendance/students", label: "Student Attendance", labelKey: "studentAttendance" },
    { href: "/reception/students", label: "Students", labelKey: "students" },
  ],
  sales: [
    { href: "/sales/leads", label: "My Leads", labelKey: "myLeads" },
    { href: "/sales/files", label: "Files", labelKey: "files" },
  ],
  teacher: [
    { href: "/teacher/follow-up", label: "Teacher Student Follow Up", labelKey: "teacherFollowUp" },
  ],
};

export function AppShell({ profile, children, lang }: { profile: UserProfile; children: React.ReactNode; lang: Lang }) {
  const t = dictionaries[lang];
  const isRtl = direction(lang) === "rtl";
  const visibleNav = hasSupabaseEnv()
    ? nav[profile.role]
    : [
        ...nav.admin,
        { href: "/sales/leads", label: "Sales Leads", labelKey: "myLeads" as const },
        { href: "/sales/files", label: "Sales Files", labelKey: "files" as const },
        { href: "/teacher/follow-up", label: "Teacher Student Follow Up", labelKey: "teacherFollowUp" as const },
      ];
  const adminGroups = [
    { label: t.nav.studentsGroup, items: visibleNav.filter((item) => ["/admin/students", "/admin/classes", "/reception/attendance/students", "/admin/exams", "/admin/exams-management"].includes(item.href)) },
    { label: t.nav.staffGroup, items: visibleNav.filter((item) => item.href.startsWith("/admin/hr")) },
    { label: t.nav.salesGroup, items: visibleNav.filter((item) => item.href.includes("sales") || item.href.includes("/sales/")) },
    { label: t.nav.financeGroup, items: visibleNav.filter((item) => ["/admin/accounts", "/admin/treasury", "/admin/reports", "/admin/textbooks"].includes(item.href)) },
    { label: t.nav.systemGroup, items: visibleNav.filter((item) => !["/admin/students", "/admin/classes", "/reception/attendance/students", "/admin/exams", "/admin/exams-management", "/admin/accounts", "/admin/treasury", "/admin/reports", "/admin/textbooks"].includes(item.href) && !item.href.startsWith("/admin/hr") && !item.href.includes("sales") && !item.href.includes("/sales/") && !item.href.startsWith("/teacher/") && !item.href.startsWith("/reception/")) },
  ].filter((group) => group.items.length);
  const navGroups = profile.role === "admin" ? adminGroups : [{ label: "", items: visibleNav }];
  return (
    <div className="min-h-screen bg-[#FCFAF6]">
      <aside className={`fixed inset-y-0 hidden w-64 bg-white p-5 md:block ${isRtl ? "right-0 border-l" : "left-0 border-r"}`}>
        <div className="flex items-center gap-3 font-semibold text-primary">
          <Logo className="h-12 w-auto object-contain" />
        </div>
        <nav className="mt-8 grid gap-4" aria-label={t.academySystem}>
          {navGroups.map((group) => group.label ? <details key={group.label} open className="group"><summary className="cursor-pointer list-none px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground after:float-right after:content-['+'] group-open:after:content-['−']">{group.label}</summary><div className="mt-1 grid gap-1">{group.items.map((item) => <Link key={item.href} className={`rounded-md border-transparent px-3 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:border-brand-red hover:bg-muted ${isRtl ? "border-r-2 text-right" : "border-l-2 text-left"}`} href={item.href}>{t.nav[item.labelKey]}</Link>)}</div></details> : group.items.map((item) => <Link key={item.href} className="rounded-md px-3 py-2 text-sm" href={item.href}>{t.nav[item.labelKey]}</Link>))}
        </nav>
        <form action="/api/auth/signout" className="absolute bottom-5 left-5 right-5">
          <Button className="w-full" variant="outline">
            <LogOut size={16} /> {t.signOut}
          </Button>
        </form>
      </aside>
      <main className={`min-w-0 ${isRtl ? "md:pr-64" : "md:pl-64"}`}>
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b bg-white/95 px-3 backdrop-blur sm:px-4 md:px-8">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground sm:text-sm">{t.roles[profile.role]}</p>
            <h1 className="truncate font-semibold">{profile.full_name}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguageToggle lang={lang} />
            <div className="hidden text-sm font-medium text-primary sm:block">{t.academySystem}</div>
          </div>
        </header>
        <div className="border-b bg-white px-3 py-2 md:hidden">
          <details>
            <summary className="cursor-pointer list-none rounded-md border px-3 py-2 text-sm font-semibold text-primary">{lang === "ar" ? "القائمة" : "Menu"}</summary>
            <nav className="mt-2 grid gap-3" aria-label={t.academySystem}>
              {navGroups.map((group) => group.label ? <details key={group.label} open className="group"><summary className="cursor-pointer list-none rounded-md px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground after:float-right after:content-['+'] group-open:after:content-['−']">{group.label}</summary><div className="grid gap-1">{group.items.map((item) => <Link key={item.href} className="rounded-md px-3 py-2 text-sm hover:bg-muted" href={item.href}>{t.nav[item.labelKey]}</Link>)}</div></details> : group.items.map((item) => <Link key={item.href} className="rounded-md px-3 py-2 text-sm" href={item.href}>{t.nav[item.labelKey]}</Link>))}
            </nav>
            <form action="/api/auth/signout" className="mt-2">
              <Button className="w-full" variant="outline"><LogOut size={16} /> {t.signOut}</Button>
            </form>
          </details>
        </div>
        <div className="min-w-0 p-3 sm:p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
