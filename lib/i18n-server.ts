import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n";

export async function getCurrentLanguage(): Promise<Lang> {
  const cookieStore = await cookies();
  return cookieStore.get("fd_lang")?.value === "ar" ? "ar" : "en";
}
