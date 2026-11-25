import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return NextResponse.json(
        { error: "Falta configurar Supabase." },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No se recibió el token de sesión." },
        { status: 401 }
      );
    }

    const token = authorization.slice(7);

    const supabaseAuth = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "La sesión no es válida o ha expirado." },
        { status: 401 }
      );
    }

    const { data: docente, error: errorDocente } = await supabaseAdmin
      .from("usuarios")
      .select("id, rol, activo")
      .eq("id", user.id)
      .single();

    if (
      errorDocente ||
      !docente ||
      docente.rol !== "docente" ||
      docente.activo !== true
    ) {
      return NextResponse.json(
        { error: "No tenés permisos para consultar la Biblioteca MR." },
        { status: 403 }
      );
    }

    const { data: materiales, error: errorMateriales } = await supabaseAdmin
      .from("biblioteca_materiales")
      .select(
        "id, titulo, descripcion, nivel, grado, asignatura, servicio, tipo, categoria, portada_url, coleccion, created_at"
      )
      .eq("activo", true)
      .order("created_at", { ascending: false });

    if (errorMateriales) {
      console.error("Error consultando Biblioteca MR:", errorMateriales);
      return NextResponse.json(
        { error: "No se pudieron cargar los materiales publicados." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, materiales: materiales ?? [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Error en Biblioteca MR docente:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error al consultar la Biblioteca MR.",
      },
      { status: 500 }
    );
  }
}
