import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ROLES_VALIDOS = [
  "admin",
  "asesora",
  "estudiante",
] as const;

async function verificarAdministrador(request: Request) {
  const autorizacion =
    request.headers.get("authorization");

  if (!autorizacion) {
    return {
      ok: false,
      status: 401,
      error: "No autorizado.",
    };
  }

  if (!autorizacion.startsWith("Bearer ")) {
    return {
      ok: false,
      status: 401,
      error: "Token de autenticación inválido.",
    };
  }

  const token = autorizacion
    .replace("Bearer ", "")
    .trim();

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "No autorizado.",
    };
  }

  const {
    data: usuarioAuth,
    error: usuarioAuthError,
  } = await supabaseAdmin.auth.getUser(token);

  if (
    usuarioAuthError ||
    !usuarioAuth.user
  ) {
    return {
      ok: false,
      status: 401,
      error: "La sesión no es válida.",
    };
  }

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
    return {
      ok: false,
      status: 403,
      error:
        "No se encontró la cuenta del usuario.",
    };
  }

  if (!usuarioActual.activo) {
    return {
      ok: false,
      status: 403,
      error:
        "La cuenta del administrador está inactiva.",
    };
  }

  if (usuarioActual.rol !== "admin") {
    return {
      ok: false,
      status: 403,
      error:
        "No tienes permisos para realizar esta acción.",
    };
  }

  return {
    ok: true,
    usuario: usuarioActual,
  };
}

/*
 * ==========================================
 * GET
 * PROGRESO DE LOS ESTUDIANTES
 * ==========================================
 */

export async function GET(request: Request) {
  try {
    const autorizacion =
      await verificarAdministrador(request);

    if (!autorizacion.ok) {
      return NextResponse.json(
        {
          error: autorizacion.error,
        },
        {
          status: autorizacion.status,
        }
      );
    }

    /*
     * ==========================================
     * OBTENER ESTUDIANTES
     * ==========================================
     */

    const {
      data: estudiantes,
      error: estudiantesError,
    } = await supabaseAdmin
      .from("usuarios")
      .select(
        "id, nombre, correo, activo, created_at"
      )
      .eq("rol", "estudiante")
      .order("nombre", {
        ascending: true,
      });

    if (estudiantesError) {
      console.error(
        "Error al obtener estudiantes:",
        estudiantesError
      );

      return NextResponse.json(
        {
          error:
            "No se pudieron obtener los estudiantes.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ==========================================
     * OBTENER INTENTOS
     * ==========================================
     */

    const {
      data: intentos,
      error: intentosError,
    } = await supabaseAdmin
      .from("intentos_examen")
      .select(
        "id, usuario_id, modulo_id, total_preguntas, respuestas_correctas, porcentaje, fecha"
      )
      .order("fecha", {
        ascending: false,
      });

    if (intentosError) {
      console.error(
        "Error al obtener intentos:",
        intentosError
      );

      return NextResponse.json(
        {
          error:
            "No se pudieron obtener los resultados de los estudiantes.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ==========================================
     * OBTENER MÓDULOS
     * ==========================================
     */

    const {
      data: modulos,
      error: modulosError,
    } = await supabaseAdmin
      .from("modulos")
      .select("id, titulo");

    if (modulosError) {
      console.error(
        "Error al obtener módulos:",
        modulosError
      );

      return NextResponse.json(
        {
          error:
            "No se pudieron obtener los módulos.",
        },
        {
          status: 500,
        }
      );
    }

    const mapaModulos = new Map(
      (modulos || []).map((modulo) => [
        modulo.id,
        modulo.titulo,
      ])
    );

    /*
     * ==========================================
     * CONSTRUIR INFORMACIÓN DE CADA ESTUDIANTE
     * ==========================================
     */

    const resultado = (estudiantes || []).map(
      (estudiante) => {
        const intentosEstudiante =
          (intentos || []).filter(
            (intento) =>
              intento.usuario_id ===
              estudiante.id
          );

        const practicas =
          intentosEstudiante.length;

        const promedio =
          practicas > 0
            ? Math.round(
                intentosEstudiante.reduce(
                  (total, intento) =>
                    total +
                    Number(
                      intento.porcentaje || 0
                    ),
                  0
                ) / practicas
              )
            : 0;

        const mejorResultado =
          practicas > 0
            ? Math.max(
                ...intentosEstudiante.map(
                  (intento) =>
                    Number(
                      intento.porcentaje || 0
                    )
                )
              )
            : 0;

        const ultimaPractica =
          practicas > 0
            ? intentosEstudiante[0].fecha
            : null;

        /*
         * ==========================================
         * RENDIMIENTO POR MÓDULO
         * ==========================================
         */

        const mapaPorModulo =
          new Map<
            string,
            {
              modulo_id: string;
              titulo: string;
              practicas: number;
              promedio: number;
            }
          >();

        intentosEstudiante.forEach(
          (intento) => {
            const moduloId =
              intento.modulo_id;

            if (!moduloId) {
              return;
            }

            const titulo =
              mapaModulos.get(moduloId) ||
              "Módulo sin nombre";

            const actual =
              mapaPorModulo.get(moduloId);

            if (!actual) {
              mapaPorModulo.set(
                moduloId,
                {
                  modulo_id: moduloId,
                  titulo,
                  practicas: 1,
                  promedio: Number(
                    intento.porcentaje || 0
                  ),
                }
              );

              return;
            }

            actual.practicas += 1;

            actual.promedio =
              (
                (
                  actual.promedio *
                    (actual.practicas - 1) +
                  Number(
                    intento.porcentaje || 0
                  )
                ) /
                actual.practicas
              );
          }
        );

        const rendimientoModulos =
          Array.from(
            mapaPorModulo.values()
          ).map((modulo) => ({
            ...modulo,
            promedio: Math.round(
              modulo.promedio
            ),
          }));

        return {
          id: estudiante.id,
          nombre: estudiante.nombre,
          correo: estudiante.correo,
          activo: estudiante.activo,
          created_at:
            estudiante.created_at,

          practicas,
          promedio,
          mejorResultado,
          ultimaPractica,

          rendimientoModulos,
        };
      }
    );

    return NextResponse.json({
      ok: true,
      estudiantes: resultado,
    });
  } catch (error) {
    console.error(
      "Error al obtener progreso:",
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

/*
 * ==========================================
 * POST
 * CREAR USUARIO
 * ==========================================
 */

export async function POST(request: Request) {
  try {
    const autorizacion =
      await verificarAdministrador(request);

    if (!autorizacion.ok) {
      return NextResponse.json(
        {
          error: autorizacion.error,
        },
        {
          status: autorizacion.status,
        }
      );
    }

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