"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/i18n";

export function LanguageToggle({ lang }: { lang: Lang }) {
  const next = lang === "ar" ? "en" : "ar";
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        document.cookie = `fd_lang=${next}; path=/; max-age=31536000; samesite=lax`;
        window.location.reload();
      }}
    >
      <Languages size={16} />
      {lang === "ar" ? "English" : "العربية"}
    </Button>
  );
}
