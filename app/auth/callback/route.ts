
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next");

  const destino =
    next === "/establecer-contrasena"
      ? next
      : "/establecer-contrasena";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=invitacion_invalida", origin)
    );
  }

  let respuesta = NextResponse.redirect(
    new URL(destino, origin)
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          respuesta = NextResponse.redirect(
            new URL(destino, origin)
          );

          cookiesToSet.forEach(({ name, value, options }) => {
            respuesta.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=invitacion_expirada", origin)
    );
  }

  return respuesta;
}
