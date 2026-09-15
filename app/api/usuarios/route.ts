import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ROLES_VALIDOS = [
  "admin",
  "asesora",
  "estudiante",
] as const;

type Rol = (typeof ROLES_VALIDOS)[number];

/*
 * ============================================================
 * AUTORIZACIÓN
 * ============================================================
 *
 * Comprueba que la petición venga de un usuario autenticado
 * y que ese usuario tenga rol de administrador.
 */

async function obtenerAdministrador(
  request: Request
) {
  const authorization =
    request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  const token =
    authorization.replace("Bearer ", "").trim();

  if (!token) {
    return null;
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return null;
  }

  const {
    data: usuario,
    error: usuarioError,
  } = await supabaseAdmin
    .from("usuarios")
    .select("id, rol, activo")
    .eq("id", user.id)
    .maybeSingle();

  if (usuarioError || !usuario) {
    return null;
  }

  if (usuario.rol !== "admin") {
    return null;
  }

  if (usuario.activo === false) {
    return null;
  }

  return usuario;
}

/*
 * ============================================================
 * GET
 * ============================================================
 *
 * Obtiene los estudiantes y calcula su progreso.
 */

export async function GET(request: Request) {
  try {
    const administrador =
      await obtenerAdministrador(request);

    if (!administrador) {
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
     * Obtener estudiantes.
     */

    const {
      data: usuarios,
      error: usuariosError,
    } = await supabaseAdmin
      .from("usuarios")
      .select(
        "id, nombre, correo, rol, activo, created_at"
      )
      .eq("rol", "estudiante")
      .order("nombre", {
        ascending: true,
      });

    if (usuariosError) {
      console.error(
        "Error obteniendo usuarios:",
        usuariosError
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
     * Obtener intentos.
     */

    const {
      data: intentos,
      error: intentosError,
    } = await supabaseAdmin
      .from("intentos_examen")
      .select(
        `
          id,
          usuario_id,
          modulo_id,
          total_preguntas,
          respuestas_correctas,
          porcentaje,
          fecha
        `
      )
      .order("fecha", {
        ascending: false,
      });

    if (intentosError) {
      console.error(
        "Error obteniendo intentos:",
        intentosError
      );

      return NextResponse.json(
        {
          error:
            "No se pudieron obtener los resultados.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Obtener módulos.
     */

    const {
      data: modulos,
      error: modulosError,
    } = await supabaseAdmin
      .from("modulos")
      .select("id, titulo");

    if (modulosError) {
      console.error(
        "Error obteniendo módulos:",
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

    /*
     * Crear mapa de módulos.
     */

    const mapaModulos = new Map<
      string,
      string
    >();

    for (const modulo of modulos || []) {
      mapaModulos.set(
        modulo.id,
        modulo.titulo
      );
    }

    /*
     * Crear respuesta de estudiantes.
     */

    const estudiantes = (usuarios || []).map(
      (usuario) => {
        const intentosUsuario =
          (intentos || []).filter(
            (intento) =>
              intento.usuario_id ===
              usuario.id
          );

        const practicas =
          intentosUsuario.length;

        const sumaPorcentajes =
          intentosUsuario.reduce(
            (total, intento) =>
              total +
              Number(
                intento.porcentaje || 0
              ),
            0
          );

        const promedio =
          practicas > 0
            ? Math.round(
                sumaPorcentajes /
                  practicas
              )
            : 0;

        const mejorResultado =
          practicas > 0
            ? Math.max(
                ...intentosUsuario.map(
                  (intento) =>
                    Number(
                      intento.porcentaje ||
                        0
                    )
                )
              )
            : 0;

        const ultimaPractica =
          intentosUsuario.length > 0
            ? intentosUsuario[0].fecha
            : null;

        /*
         * Rendimiento por módulo.
         */

        const mapaRendimiento =
          new Map<
            string,
            {
              modulo_id: string;
              titulo: string;
              practicas: number;
              suma: number;
            }
          >();

        for (const intento of intentosUsuario) {
          const moduloId =
            intento.modulo_id;

          const titulo =
            mapaModulos.get(
              moduloId
            ) || "Módulo sin nombre";

          const existente =
            mapaRendimiento.get(
              moduloId
            );

          if (existente) {
            existente.practicas += 1;

            existente.suma += Number(
              intento.porcentaje || 0
            );
          } else {
            mapaRendimiento.set(
              moduloId,
              {
                modulo_id: moduloId,
                titulo,
                practicas: 1,
                suma: Number(
                  intento.porcentaje ||
                    0
                ),
              }
            );
          }
        }

        const rendimientoModulos =
          Array.from(
            mapaRendimiento.values()
          )
            .map((modulo) => ({
              modulo_id:
                modulo.modulo_id,

              titulo:
                modulo.titulo,

              practicas:
                modulo.practicas,

              promedio:
                Math.round(
                  modulo.suma /
                    modulo.practicas
                ),
            }))
            .sort(
              (a, b) =>
                b.promedio -
                a.promedio
            );

        return {
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          activo: usuario.activo,
          created_at:
            usuario.created_at,

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
      estudiantes,
    });
  } catch (error) {
    console.error(
      "Error en GET /api/usuarios:",
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
 * ============================================================
 * POST
 * ============================================================
 *
 * Crear usuario.
 */

export async function POST(request: Request) {
  try {
    const administrador =
      await obtenerAdministrador(request);

    if (!administrador) {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
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

    if (
      !ROLES_VALIDOS.includes(
        rol as Rol
      )
    ) {
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
      await supabaseAdmin.auth.admin.createUser(
        {
          email: correo,
          password,

          email_confirm: true,

          user_metadata: {
            nombre,
            rol,
          },
        }
      );

    if (error || !data.user) {
      console.error(
        "Error creando usuario:",
        error
      );

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

/*
 * ============================================================
 * DELETE
 * ============================================================
 *
 * Eliminar estudiante.
 *
 * IMPORTANTE:
 *
 * - Solo un administrador puede hacerlo.
 * - Un administrador no puede eliminarse a sí mismo.
 * - En esta primera versión solamente permitimos eliminar
 *   usuarios con rol "estudiante".
 * - Los intentos se eliminan mediante ON DELETE CASCADE.
 */

export async function DELETE(
  request: Request
) {
  try {
    const administrador =
      await obtenerAdministrador(request);

    if (!administrador) {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    const usuarioId =
      body?.id;

    if (
      !usuarioId ||
      typeof usuarioId !==
        "string"
    ) {
      return NextResponse.json(
        {
          error:
            "Debe indicar el usuario que desea eliminar.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Protección adicional:
     * un administrador nunca puede eliminarse
     * a sí mismo.
     */

    if (
      usuarioId ===
      administrador.id
    ) {
      return NextResponse.json(
        {
          error:
            "No puede eliminar su propia cuenta de administrador.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Buscar el usuario que se quiere eliminar.
     */

    const {
      data: usuario,
      error: usuarioError,
    } =
      await supabaseAdmin
        .from("usuarios")
        .select(
          "id, nombre, correo, rol, activo"
        )
        .eq("id", usuarioId)
        .maybeSingle();

    if (usuarioError) {
      console.error(
        "Error buscando usuario:",
        usuarioError
      );

      return NextResponse.json(
        {
          error:
            "No se pudo encontrar el usuario.",
        },
        {
          status: 500,
        }
      );
    }

    if (!usuario) {
      return NextResponse.json(
        {
          error:
            "El usuario no existe.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Por seguridad, esta primera versión
     * solamente permite eliminar estudiantes.
     */

    if (
      usuario.rol !==
      "estudiante"
    ) {
      return NextResponse.json(
        {
          error:
            "Por seguridad, solamente se pueden eliminar estudiantes desde esta sección.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Primero eliminamos el usuario de Supabase Auth.
     *
     * Esto requiere service_role y solamente se ejecuta
     * en el servidor.
     */

    const {
      error: authDeleteError,
    } =
      await supabaseAdmin.auth.admin.deleteUser(
        usuarioId
      );

    if (authDeleteError) {
      console.error(
        "Error eliminando usuario de Auth:",
        authDeleteError
      );

      return NextResponse.json(
        {
          error:
            authDeleteError.message ||
            "No se pudo eliminar la cuenta de autenticación.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Eliminamos también el registro de public.usuarios
     * si todavía existe.
     *
     * Los intentos relacionados se eliminarán mediante
     * ON DELETE CASCADE.
     */

    const {
      error: usuarioDeleteError,
    } =
      await supabaseAdmin
        .from("usuarios")
        .delete()
        .eq("id", usuarioId);

    if (usuarioDeleteError) {
      console.error(
        "Error eliminando registro de usuarios:",
        usuarioDeleteError
      );

      return NextResponse.json(
        {
          error:
            "La cuenta fue eliminada de autenticación, pero no se pudo completar la eliminación del perfil.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      ok: true,

      mensaje:
        "Estudiante eliminado correctamente.",

      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
      },
    });
  } catch (error) {
    console.error(
      "Error en DELETE /api/usuarios:",
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