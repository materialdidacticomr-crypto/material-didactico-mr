import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SIGUIENTE_URL_SUPABASE_PÚBLICA;

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "No está configurada la URL de Supabase. Configure NEXT_PUBLIC_SUPABASE_URL o SIGUIENTE_URL_SUPABASE_PÚBLICA."
  );
}

if (!serviceRoleKey) {
  throw new Error(
    "No está configurada SUPABASE_SERVICE_ROLE_KEY."
  );
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);