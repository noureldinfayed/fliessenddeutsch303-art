import { AppShell } from "@/components/layout/sidebar";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentLanguage } from "@/lib/i18n-server";

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  const lang = await getCurrentLanguage();
  const { profile } = await getCurrentUser("sales");
  return <AppShell profile={profile} lang={lang}>{children}</AppShell>;
}
