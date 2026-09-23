import { CheckCircle2, CircleAlert, Database, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Logo } from "@/components/layout/logo";
import { hasSupabaseEnv } from "@/lib/env";
import { dictionaries } from "@/lib/i18n";
import { getCurrentLanguage } from "@/lib/i18n-server";

export default async function SetupPage() {
  const lang = await getCurrentLanguage();
  const t = dictionaries[lang];
  const configured = hasSupabaseEnv();
  return (
    <main className="min-h-screen bg-[#FCFAF6] p-4 md:p-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex justify-end">
          <LanguageToggle lang={lang} />
        </div>
        <div>
          <Logo className="mb-4 h-24 w-auto object-contain" />
          <Badge className="mb-3 border-accent/40 bg-accent/10 text-primary">{t.localSetup}</Badge>
          <h1 className="text-3xl font-semibold text-primary">{t.localDemoActive}</h1>
          <p className="mt-2 text-muted-foreground">
            {t.localDemoBody}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {configured ? <CheckCircle2 className="text-brand-red" /> : <CircleAlert className="text-amber-700" />}
              {t.environmentStatus}
            </CardTitle>
            <CardDescription>{configured ? t.envPresent : t.envMissing}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-md bg-muted p-3 font-mono">
              NEXT_PUBLIC_SUPABASE_URL=
              <br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY=
              <br />
              SUPABASE_SERVICE_ROLE_KEY=
            </div>
            <p>{t.envInstructions}</p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Database size={18} /> {t.database}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t.databaseHelp}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><FileText size={18} /> {t.seedData}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t.seedHelp}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
