"use client";

import { useEffect } from "react";
import type { Lang } from "@/lib/i18n";

const replacements: Array<[string, string]> = [
  ["Academy System", "نظام إدارة الأكاديمية"],
  ["Dashboard", "لوحة التحكم"],
  ["Students", "الطلاب"],
  ["Student", "الطالب"],
  ["Classes", "الفصول"],
  ["Class", "الفصل"],
  ["Employees Check In", "تسجيل حضور الموظفين"],
  ["Students Check In", "تسجيل حضور الطلاب"],
  ["Student Attendance", "حضور الطلاب"],
  ["Teacher Attendance", "حضور المدرسين"],
  ["HR Performance", "أداء الموظفين"],
  ["Employee KPIs this month", "مؤشرات أداء الموظفين هذا الشهر"],
  ["Sales", "المبيعات"],
  ["Accounts", "الحسابات"],
  ["Treasury", "الخزينة"],
  ["Reports", "التقارير"],
  ["Admin Student Follow Up", "متابعة الطلاب - الإدارة"],
  ["Teacher Student Follow Up", "متابعة الطلاب - المدرسين"],
  ["Branches", "الفروع"],
  ["Users", "المستخدمون"],
  ["Files", "الملفات"],
  ["My Leads", "عملائي"],
  ["Add Student", "إضافة طالب"],
  ["Edit Student", "تعديل الطالب"],
  ["Save Student", "حفظ الطالب"],
  ["Save student changes", "حفظ تعديلات الطالب"],
  ["Add Treasury Record", "إضافة سجل خزينة"],
  ["Send Daily Report Now", "إرسال تقرير اليوم الآن"],
  ["Search...", "بحث..."],
  ["Search follow up...", "البحث في المتابعة..."],
  ["Previous", "السابق"],
  ["Next", "التالي"],
  ["No records yet.", "لا توجد سجلات بعد."],
  ["No students found.", "لا يوجد طلاب."],
  ["No students match this filter.", "لا يوجد طلاب يطابقون هذا الفلتر."],
  ["Full name", "الاسم بالكامل"],
  ["Phone", "رقم الهاتف"],
  ["Email", "البريد الإلكتروني"],
  ["Level", "المستوى"],
  ["Tags", "التصنيفات"],
  ["Teacher", "المدرس"],
  ["Mode", "النظام"],
  ["Online", "أونلاين"],
  ["Offline", "أوفلاين"],
  ["Active", "نشط"],
  ["Inactive", "غير نشط"],
  ["Graduated", "متخرج"],
  ["Status", "الحالة"],
  ["Actions", "الإجراءات"],
  ["Edit", "تعديل"],
  ["Delete", "حذف"],
  ["Comment", "تعليق"],
  ["Save comment", "حفظ التعليق"],
  ["Print/PDF", "طباعة / PDF"],
  ["Print payslip", "طباعة كشف المرتب"],
  ["Print Receipt", "طباعة الإيصال"],
  ["Price", "السعر"],
  ["Total price", "السعر الإجمالي"],
  ["Amount paid", "المدفوع"],
  ["Not paid", "المتبقي"],
  ["Payment date", "تاريخ السداد"],
  ["Payment comment", "تعليق السداد"],
  ["Notes", "الملاحظات"],
  ["Date", "التاريخ"],
  ["Type", "النوع"],
  ["Amount", "المبلغ"],
  ["Role", "الوظيفة"],
  ["Employee", "الموظف"],
  ["Pay type", "نوع الأجر"],
  ["Hours", "الساعات"],
  ["Sessions", "الحصص"],
  ["Base", "الأساسي"],
  ["Bonuses", "المكافآت"],
  ["Deductions", "الخصومات"],
  ["Total", "الإجمالي"],
  ["Feedback", "التقييمات"],
  ["Latest Feedback", "آخر تقييم"],
  ["Latest Exam", "آخر اختبار"],
  ["Attendance", "الحضور"],
  ["Save", "حفظ"],
  ["Cancel", "إلغاء"],
  ["Close editor", "إغلاق التعديل"],
  ["Convert to Student", "تحويل إلى طالب"],
  ["Add Note", "إضافة ملاحظة"],
  ["Confirm Import", "تأكيد الاستيراد"],
  ["Import Students", "استيراد الطلاب"],
  ["Export Students", "تصدير الطلاب"],
  ["Import Classes", "استيراد الفصول"],
  ["Export Classes", "تصدير الفصول"],
  ["Sign out", "تسجيل الخروج"],
];

function translate(value: string) {
  return replacements.reduce((result, [english, arabic]) => {
    return result.replace(new RegExp(`\\b${english.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\b`, "g"), arabic);
  }, value);
}

function translateTree(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) nodes.push(node as Text);
  for (const textNode of nodes) {
    const parent = textNode.parentElement;
    if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) continue;
    const next = translate(textNode.nodeValue ?? "");
    if (next !== textNode.nodeValue) textNode.nodeValue = next;
  }
  document.querySelectorAll<HTMLElement>("input, textarea, select, button, [aria-label], [title]").forEach((element) => {
    for (const attribute of ["placeholder", "aria-label", "title"]) {
      const value = element.getAttribute(attribute);
      if (value) element.setAttribute(attribute, translate(value));
    }
  });
}

export function ArabicUiTranslator({ lang }: { lang: Lang }) {
  useEffect(() => {
    if (lang !== "ar") return;
    translateTree(document.body);
    const observer = new MutationObserver(() => translateTree(document.body));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [lang]);
  return null;
}
