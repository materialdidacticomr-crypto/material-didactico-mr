
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ROLES_VALIDOS = [
  "admin",
  "asesora",
  "docente",
  "estudiante",
] as const;

type Rol = (typeof ROLES_VALIDOS)[number];

/* =========================================================
   AUTORIZACIÓN
========================================================= */

async function obtenerAdministrador(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.replace("Bearer ", "").trim();

  if (!token) return null;

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) return null;

  const { data: usuario, error } = await supabaseAdmin
    .from("usuarios")
    .select("id, rol, activo")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !usuario) return null;

  if (usuario.rol !== "admin" || usuario.activo === false) {
    return null;
  }

  return usuario;
}

/* =========================================================
   GET: USUARIOS Y ESTADÍSTICAS
========================================================= */

export async function GET(request: Request) {
  try {
    const administrador = await obtenerAdministrador(request);

    if (!administrador) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const { data: usuarios, error: usuariosError } =
      await supabaseAdmin
        .from("usuarios")
        .select("id, nombre, correo, rol, activo, created_at")
        .order("nombre", { ascending: true });

    if (usuariosError) {
      console.error(usuariosError);
      return NextResponse.json(
        { error: "No se pudieron obtener los usuarios." },
        { status: 500 }
      );
    }

    const { data: intentos, error: intentosError } =
      await supabaseAdmin
        .from("intentos_examen")
        .select(`
          id,
          usuario_id,
          modulo_id,
          total_preguntas,
          respuestas_correctas,
          porcentaje,
          fecha
        `)
        .order("fecha", { ascending: false });

    if (intentosError) {
      console.error(intentosError);
      return NextResponse.json(
        { error: "No se pudieron obtener los resultados." },
        { status: 500 }
      );
    }

    const { data: modulos, error: modulosError } =
      await supabaseAdmin
        .from("modulos")
        .select("id, titulo");

    if (modulosError) {
      console.error(modulosError);
      return NextResponse.json(
        { error: "No se pudieron obtener los módulos." },
        { status: 500 }
      );
    }

    const mapaModulos = new Map<string, string>();

    for (const modulo of modulos || []) {
      mapaModulos.set(modulo.id, modulo.titulo);
    }

    const listaUsuarios = usuarios || [];
    const listaIntentos = intentos || [];

    const estudiantes = listaUsuarios
      .filter((usuario) => usuario.rol === "estudiante")
      .map((usuario) => {
        const intentosUsuario = listaIntentos.filter(
          (intento) => intento.usuario_id === usuario.id
        );

        const practicas = intentosUsuario.length;

        const suma = intentosUsuario.reduce(
          (total, intento) =>
            total + Number(intento.porcentaje || 0),
          0
        );

        const promedio =
          practicas > 0 ? Math.round(suma / practicas) : 0;

        const mejorResultado =
          practicas > 0
            ? Math.max(
                ...intentosUsuario.map((intento) =>
                  Number(intento.porcentaje || 0)
                )
              )
            : 0;

        const rendimiento = new Map<
          string,
          {
            modulo_id: string;
            titulo: string;
            practicas: number;
            suma: number;
          }
        >();

        for (const intento of intentosUsuario) {
          const moduloId = intento.modulo_id;
          const existente = rendimiento.get(moduloId);

          if (existente) {
            existente.practicas += 1;
            existente.suma += Number(intento.porcentaje || 0);
          } else {
            rendimiento.set(moduloId, {
              modulo_id: moduloId,
              titulo: mapaModulos.get(moduloId) || "Módulo sin nombre",
              practicas: 1,
              suma: Number(intento.porcentaje || 0),
            });
          }
        }

        const rendimientoModulos = Array.from(rendimiento.values())
          .map((modulo) => ({
            modulo_id: modulo.modulo_id,
            titulo: modulo.titulo,
            practicas: modulo.practicas,
            promedio: Math.round(modulo.suma / modulo.practicas),
          }))
          .sort((a, b) => b.promedio - a.promedio);

        return {
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          activo: usuario.activo,
          created_at: usuario.created_at,
          practicas,
          promedio,
          mejorResultado,
          ultimaPractica: intentosUsuario[0]?.fecha || null,
          rendimientoModulos,
        };
      });

    const estadisticas = {
      total: listaUsuarios.length,
      activos: listaUsuarios.filter((u) => u.activo === true).length,
      inactivos: listaUsuarios.filter((u) => u.activo === false).length,
      admin: listaUsuarios.filter((u) => u.rol === "admin").length,
      asesora: listaUsuarios.filter((u) => u.rol === "asesora").length,
      docente: listaUsuarios.filter((u) => u.rol === "docente").length,
      estudiante: listaUsuarios.filter((u) => u.rol === "estudiante").length,
    };

    return NextResponse.json({
      ok: true,
      usuarios: listaUsuarios,
      estudiantes,
      estadisticas,
    });
  } catch (error) {
    console.error("Error en GET /api/usuarios:", error);

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST: CREAR USUARIOS E INVITAR DOCENTES
========================================================= */

export async function POST(request: Request) {
  try {
    const administrador = await obtenerAdministrador(request);

    if (!administrador) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const nombre = String(body?.nombre || "").trim();
    const correo = String(body?.correo || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const rol = body?.rol;

    if (!nombre || !correo || !rol) {
      return NextResponse.json(
        { error: "El nombre, correo y rol son obligatorios." },
        { status: 400 }
      );
    }

    if (!ROLES_VALIDOS.includes(rol as Rol)) {
      return NextResponse.json(
        { error: "El rol seleccionado no es válido." },
        { status: 400 }
      );
    }

    /* DOCENTE: INVITACIÓN POR CORREO */

    if (rol === "docente") {
      const redirectTo = new URL(
        "/establecer-contrasena",
        process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
      ).toString();

      const { data, error } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(
          correo,
          {
            data: {
              nombre,
              rol: "docente",
            },
            redirectTo,
          }
        );

      if (error || !data.user) {
        console.error("Error enviando invitación docente:", error);

        return NextResponse.json(
          {
            error:
              error?.message ||
              "No se pudo enviar la invitación al docente.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        ok: true,
        invitacion: true,
        mensaje: "Invitación enviada correctamente al correo del docente.",
        usuario: {
          id: data.user.id,
          nombre,
          correo,
          rol: "docente",
          activo: true,
        },
      });
    }

    /* OTROS ROLES: CONSERVAN EL REGISTRO ACTUAL */

    if (!password || password.length < 8) {
      return NextResponse.json(
        {
          error: "La contraseña debe tener al menos 8 caracteres.",
        },
        { status: 400 }
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
      console.error("Error creando usuario:", error);

      return NextResponse.json(
        {
          error: error?.message || "No se pudo crear el usuario.",
        },
        { status: 400 }
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
        activo: true,
      },
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH: ACTUALIZAR ROL Y ESTADO
========================================================= */

export async function PATCH(request: Request) {
  try {
    const administrador = await obtenerAdministrador(request);

    if (!administrador) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, rol, activo } = body || {};

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Debe indicar el usuario que desea actualizar." },
        { status: 400 }
      );
    }

    if (id === administrador.id) {
      return NextResponse.json(
        { error: "No puede modificar su propia cuenta desde esta sección." },
        { status: 403 }
      );
    }

    const cambios: { rol?: Rol; activo?: boolean } = {};

    if (rol !== undefined) {
      if (!ROLES_VALIDOS.includes(rol as Rol)) {
        return NextResponse.json(
          { error: "El rol seleccionado no es válido." },
          { status: 400 }
        );
      }

      cambios.rol = rol as Rol;
    }

    if (activo !== undefined) {
      if (typeof activo !== "boolean") {
        return NextResponse.json(
          { error: "El estado debe ser activo o inactivo." },
          { status: 400 }
        );
      }

      cambios.activo = activo;
    }

    if (Object.keys(cambios).length === 0) {
      return NextResponse.json(
        { error: "No se indicaron cambios para guardar." },
        { status: 400 }
      );
    }

    const { data: usuarioExistente, error: busquedaError } =
      await supabaseAdmin
        .from("usuarios")
        .select("id, nombre, correo, rol, activo")
        .eq("id", id)
        .maybeSingle();

    if (busquedaError || !usuarioExistente) {
      return NextResponse.json(
        { error: "No se encontró el usuario." },
        { status: 404 }
      );
    }

    if (
      usuarioExistente.rol === "admin" &&
      (cambios.rol !== undefined || cambios.activo === false)
    ) {
      return NextResponse.json(
        {
          error: "No se puede modificar otra cuenta administradora desde esta sección.",
        },
        { status: 403 }
      );
    }

    const { data: usuarioActualizado, error: actualizacionError } =
      await supabaseAdmin
        .from("usuarios")
        .update(cambios)
        .eq("id", id)
        .select("id, nombre, correo, rol, activo, created_at")
        .single();

    if (actualizacionError || !usuarioActualizado) {
      console.error(actualizacionError);

      return NextResponse.json(
        { error: "No se pudieron guardar los cambios." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      mensaje: "Usuario actualizado correctamente.",
      usuario: usuarioActualizado,
    });
  } catch (error) {
    console.error("Error en PATCH /api/usuarios:", error);

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE: ELIMINAR ESTUDIANTES
========================================================= */

export async function DELETE(request: Request) {
  try {
    const administrador = await obtenerAdministrador(request);

    if (!administrador) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const usuarioId = body?.id;

    if (!usuarioId || typeof usuarioId !== "string") {
      return NextResponse.json(
        { error: "Debe indicar el usuario que desea eliminar." },
        { status: 400 }
      );
    }

    if (usuarioId === administrador.id) {
      return NextResponse.json(
        { error: "No puede eliminar su propia cuenta." },
        { status: 403 }
      );
    }

    const { data: usuario, error: usuarioError } =
      await supabaseAdmin
        .from("usuarios")
        .select("id, nombre, correo, rol, activo")
        .eq("id", usuarioId)
        .maybeSingle();

    if (usuarioError || !usuario) {
      return NextResponse.json(
        { error: "El usuario no existe." },
        { status: 404 }
      );
    }

    if (usuario.rol !== "estudiante") {
      return NextResponse.json(
        {
          error: "Solamente se pueden eliminar estudiantes desde esta sección.",
        },
        { status: 403 }
      );
    }

    const { error: authDeleteError } =
      await supabaseAdmin.auth.admin.deleteUser(usuarioId);

    if (authDeleteError) {
      console.error(authDeleteError);

      return NextResponse.json(
        { error: authDeleteError.message || "No se pudo eliminar la cuenta." },
        { status: 500 }
      );
    }

    const { error: usuarioDeleteError } =
      await supabaseAdmin
        .from("usuarios")
        .delete()
        .eq("id", usuarioId);

    if (usuarioDeleteError) {
      console.error(usuarioDeleteError);

      return NextResponse.json(
        {
          error: "La cuenta fue eliminada de autenticación, pero no se pudo completar la eliminación del perfil.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      mensaje: "Estudiante eliminado correctamente.",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
      },
    });
  } catch (error) {
    console.error("Error en DELETE /api/usuarios:", error);

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
