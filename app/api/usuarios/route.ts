import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ROLES_VALIDOS = [
  "admin",
  "asesora",
  "estudiante",
] as const;

export async function POST(request: Request) {
  try {
    /*
     * ==========================================
     * 1. OBTENER TOKEN DEL USUARIO AUTENTICADO
     * ==========================================
     */

    const autorizacion =
      request.headers.get("authorization");

    if (!autorizacion) {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    if (!autorizacion.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Token de autenticación inválido.",
        },
        {
          status: 401,
        }
      );
    }

    const token = autorizacion.replace(
      "Bearer ",
      ""
    ).trim();

    if (!token) {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * ==========================================
     * 2. VERIFICAR EL USUARIO EN SUPABASE
     * ==========================================
     */

    const {
      data: usuarioAuth,
      error: usuarioAuthError,
    } =
      await supabaseAdmin.auth.getUser(token);

    if (
      usuarioAuthError ||
      !usuarioAuth.user
    ) {
      return NextResponse.json(
        {
          error: "La sesión no es válida.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * ==========================================
     * 3. BUSCAR EL USUARIO EN NUESTRA TABLA
     * ==========================================
     */

    const {
      data: usuarioActual,
      error: usuarioError,
    } = await supabaseAdmin
      .from("usuarios")
      .select(
        "id, nombre, correo, rol, activo"
      )
      .eq("id", usuarioAuth.user.id)
      .single();

    if (
      usuarioError ||
      !usuarioActual
    ) {
      return NextResponse.json(
        {
          error:
            "No se encontró la cuenta del usuario.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ==========================================
     * 4. COMPROBAR QUE LA CUENTA ESTÉ ACTIVA
     * ==========================================
     */

    if (!usuarioActual.activo) {
      return NextResponse.json(
        {
          error:
            "La cuenta del administrador está inactiva.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ==========================================
     * 5. COMPROBAR QUE SEA ADMINISTRADOR
     * ==========================================
     */

    if (usuarioActual.rol !== "admin") {
      return NextResponse.json(
        {
          error:
            "No tienes permisos para crear usuarios.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * ==========================================
     * 6. LEER DATOS DEL NUEVO USUARIO
     * ==========================================
     */

    const body = await request.json();

    const {
      nombre,
      correo,
      password,
      rol,
    } = body;

    if (
      !nombre ||
      !correo ||
      !password ||
      !rol
    ) {
      return NextResponse.json(
        {
          error:
            "Todos los campos son obligatorios.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ==========================================
     * 7. VALIDAR ROL
     * ==========================================
     */

    if (!ROLES_VALIDOS.includes(rol)) {
      return NextResponse.json(
        {
          error:
            "El rol seleccionado no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ==========================================
     * 8. CREAR USUARIO EN SUPABASE AUTH
     * ==========================================
     */

    const {
      data,
      error,
    } =
      await supabaseAdmin.auth.admin.createUser({
        email: correo,
        password,
        email_confirm: true,
        user_metadata: {
          nombre,
          rol,
        },
      });

    if (
      error ||
      !data.user
    ) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "No se pudo crear el usuario.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ==========================================
     * 9. RESPUESTA EXITOSA
     * ==========================================
     */

    return NextResponse.json({
      ok: true,
      mensaje:
        "Usuario creado correctamente.",
      usuario: {
        id: data.user.id,
        nombre,
        correo,
        rol,
      },
    });
  } catch (error) {
    console.error(
      "Error al crear usuario:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Error interno del servidor.",
      },
      {
        status: 500,
      }
    );
  }
}