
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey || !serviceKey) {
      return NextResponse.json(
        { error: "Falta configurar una variable de Supabase." },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Debés iniciar sesión." },
        { status: 401 }
      );
    }

    const token = authorization.replace("Bearer ", "");

    const supabaseAuth = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: authData, error: authError } =
      await supabaseAuth.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "La sesión no es válida o ha expirado." },
        { status: 401 }
      );
    }

    const supabaseAdmin = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Verificar que el usuario sea administrador activo.
    const { data: administrador, error: errorAdmin } =
      await supabaseAdmin
        .from("usuarios")
        .select("id, rol, activo")
        .eq("id", authData.user.id)
        .single();

    if (
      errorAdmin ||
      !administrador ||
      administrador.rol !== "admin" ||
      administrador.activo !== true
    ) {
      return NextResponse.json(
        { error: "No tenés permisos para registrar docentes." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const nombre = String(body?.nombre || "").trim();
    const correo = String(body?.correo || "").trim().toLowerCase();

    if (!nombre || !correo) {
      return NextResponse.json(
        { error: "El nombre y el correo son obligatorios." },
        { status: 400 }
      );
    }

    if (nombre.length > 150 || correo.length > 254) {
      return NextResponse.json(
        { error: "El nombre o el correo son demasiado largos." },
        { status: 400 }
      );
    }

    const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formatoCorreo.test(correo)) {
      return NextResponse.json(
        { error: "Ingresá un correo electrónico válido." },
        { status: 400 }
      );
    }

    // Validar el dominio desde el que se envía la invitación.
    const origen = request.nextUrl.origin;

    const origenesPermitidos = [
      "https://material-didactico-mr.vercel.app",
      "http://localhost:3000",
    ];

    if (!origenesPermitidos.includes(origen)) {
      return NextResponse.json(
        { error: "El origen de la solicitud no está autorizado." },
        { status: 403 }
      );
    }

    const redirectTo = new URL(
      "/auth/callback?next=/establecer-contrasena",
      origen
    ).toString();

    // Crear la cuenta y enviar la invitación por correo.
    // Supabase crea automáticamente el perfil mediante el trigger.
    const { data: invitacion, error: errorInvitacion } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(correo, {
        redirectTo,
        data: {
          nombre,
          rol: "docente",
        },
      });

    if (errorInvitacion || !invitacion.user) {
      return NextResponse.json(
        {
          error:
            errorInvitacion?.message ||
            "No se pudo enviar la invitación.",
        },
        { status: 400 }
      );
    }

    // Comprobar el perfil creado automáticamente.
    const { data: perfil, error: errorPerfil } =
      await supabaseAdmin
        .from("usuarios")
        .select("id, nombre, correo, rol")
        .eq("id", invitacion.user.id)
        .maybeSingle();

    if (errorPerfil || !perfil || perfil.rol !== "docente") {
      return NextResponse.json(
        {
          error:
            "La invitación fue procesada, pero no se pudo verificar el perfil docente. Revisá la tabla usuarios antes de volver a invitar ese correo.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Docente registrado e invitación enviada correctamente.",
    });

  } catch {
    return NextResponse.json(
      { error: "Ocurrió un error inesperado al registrar al docente." },
      { status: 500 }
    );
  }
}
