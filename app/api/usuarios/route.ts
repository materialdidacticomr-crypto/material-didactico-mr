import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ROLES_VALIDOS = ["admin", "asesora", "estudiante"] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { nombre, correo, password, rol } = body;

    if (!nombre || !correo || !password || !rol) {
      return NextResponse.json(
        {
          error: "Todos los campos son obligatorios.",
        },
        {
          status: 400,
        }
      );
    }

    if (!ROLES_VALIDOS.includes(rol)) {
      return NextResponse.json(
        {
          error: "El rol seleccionado no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } =
      await supabaseAdmin.auth.admin.createUser({
        email: correo,
        password,
        email_confirm: true,
        user_metadata: {
          nombre,
          rol,
        },
      });

    if (error || !data.user) {
      return NextResponse.json(
        {
          error: error?.message ?? "No se pudo crear el usuario.",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      mensaje: "Usuario creado correctamente.",
      usuario: {
        id: data.user.id,
        nombre,
        correo,
        rol,
      },
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);

    return NextResponse.json(
      {
        error: "Error interno del servidor.",
      },
      {
        status: 500,
      }
    );
  }
}