
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { listarMaterialesDrive } from "@/lib/google-drive";

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

    const { data: administrador, error: errorAdmin } =
      await supabaseAdmin
        .from("usuarios")
        .select("id, rol, activo")
        .eq("id", user.id)
        .single();

    if (
      errorAdmin ||
      !administrador ||
      administrador.rol !== "admin" ||
      administrador.activo !== true
    ) {
      return NextResponse.json(
        { error: "No tenés permisos para realizar esta prueba." },
        { status: 403 }
      );
    }

    const archivos = await listarMaterialesDrive();

    return NextResponse.json({
      success: true,
      message: "Conexión con Google Drive establecida correctamente.",
      totalArchivos: archivos.length,
      archivos: archivos.map((archivo) => ({
        id: archivo.id,
        nombre: archivo.name,
        tipo: archivo.mimeType,
      })),
    });
  } catch (error) {
    console.error("Error en prueba de Biblioteca MR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo conectar con Google Drive.",
      },
      { status: 500 }
    );
  }
}
