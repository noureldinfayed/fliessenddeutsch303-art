import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hasSupabaseAdminEnv, hasSupabaseEnv } from "@/lib/env";
import { createLocalSupabaseClient } from "@/lib/local-db";

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  if (!hasSupabaseEnv()) {
    return createLocalSupabaseClient() as unknown as SupabaseClient;
  }
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );
}

export function createSupabaseAdminClient(): SupabaseClient {
  if (!hasSupabaseAdminEnv()) {
    return createLocalSupabaseClient() as unknown as SupabaseClient;
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
