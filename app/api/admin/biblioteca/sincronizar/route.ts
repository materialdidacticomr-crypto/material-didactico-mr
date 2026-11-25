
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { listarMaterialesDrive } from "@/lib/google-drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clasificarMaterial(ruta: string, nombre: string) {
  const segmentos = ruta.split("/").filter(Boolean);
  const texto = `${ruta} ${nombre}`.toLowerCase();

  const coleccion = segmentos.some(
    (segmento) => segmento.toLowerCase() === "material 2027"
  )
    ? "Material 2027"
    : "Colección anterior";

  let categoria = "Folletos";
  let servicio: string | null = null;

  if (texto.includes("antolog")) {
    categoria = "Antologías";
  } else if (
    texto.includes("servicios de apoyo") ||
    texto.includes("servicio de apoyo") ||
    texto.includes("material especial de apoyo")
  ) {
    categoria = "Servicios de apoyo";

    const indiceCarpeta = segmentos.findIndex((segmento) => {
      const nombreCarpeta = segmento.toLowerCase();

      return (
        nombreCarpeta.includes("servicios de apoyo") ||
        nombreCarpeta.includes("servicio de apoyo") ||
        nombreCarpeta.includes("material especial de apoyo")
      );
    });

    servicio =
      indiceCarpeta >= 0
        ? segmentos[indiceCarpeta + 1] ??
          segmentos[indiceCarpeta]
        : null;
  }

  const grados = [
    {
      patron: /primer grado|1\.\s*primer grado/i,
      nombre: "Primer grado",
    },
    {
      patron: /segundo grado|2\.\s*segundo grado/i,
      nombre: "Segundo grado",
    },
    {
      patron: /tercer grado|3\.\s*tercer grado/i,
      nombre: "Tercer grado",
    },
    {
      patron: /cuarto grado|4\.\s*cuarto grado/i,
      nombre: "Cuarto grado",
    },
    {
      patron: /quinto grado|5\.\s*quinto grado/i,
      nombre: "Quinto grado",
    },
    {
      patron: /sexto grado|6\.\s*sexto grado/i,
      nombre: "Sexto grado",
    },
  ];

  let grado: string | null = null;
  let nivel: string | null = null;

  for (const item of grados) {
    if (item.patron.test(texto)) {
      grado = item.nombre;
      nivel = "Primaria";
      break;
    }
  }

  return {
    coleccion,
    categoria,
    servicio,
    grado,
    nivel,
  };
}

export async function POST(request: NextRequest) {
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
        { error: "No tenés permisos para sincronizar materiales." },
        { status: 403 }
      );
    }

    const archivos = await listarMaterialesDrive();

    if (archivos.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No se encontraron archivos PDF en Google Drive.",
        totalDetectados: 0,
        nuevosRegistrados: 0,
        existentes: 0,
        actualizados: 0,
      });
    }

    const identificadores = archivos.map((archivo) => archivo.id);

    const registrosExistentes = new Map<
      string,
      { id: string; drive_file_id: string }
    >();

    for (let i = 0; i < identificadores.length; i += 100) {
      const lote = identificadores.slice(i, i + 100);

      const { data, error } = await supabaseAdmin
        .from("biblioteca_materiales")
        .select("id, drive_file_id")
        .in("drive_file_id", lote);

      if (error) {
        throw new Error(
          `No se pudieron consultar los materiales existentes: ${error.message}`
        );
      }

      for (const registro of data ?? []) {
        if (registro.drive_file_id) {
          registrosExistentes.set(
            registro.drive_file_id,
            {
              id: registro.id,
              drive_file_id: registro.drive_file_id,
            }
          );
        }
      }
    }

    let nuevosRegistrados = 0;
    let actualizados = 0;

    const nuevos = [];

    for (const archivo of archivos) {
      const clasificacion = clasificarMaterial(
        archivo.rutaCarpeta,
        archivo.name
      );

      const metadata = {
        categoria: clasificacion.categoria,
        coleccion: clasificacion.coleccion,
        nivel: clasificacion.nivel,
        grado: clasificacion.grado,
        servicio: clasificacion.servicio,
        drive_ruta: archivo.rutaCarpeta,
        drive_modified_time: archivo.modifiedTime ?? null,
        drive_size: archivo.size
          ? Number(archivo.size)
          : null,
      };

      const existente = registrosExistentes.get(archivo.id);

      if (existente) {
        const { error } = await supabaseAdmin
          .from("biblioteca_materiales")
          .update(metadata)
          .eq("id", existente.id);

        if (error) {
          throw new Error(
            `No se pudo actualizar ${archivo.name}: ${error.message}`
          );
        }

        actualizados++;
      } else {
        nuevos.push({
          titulo: archivo.name.replace(/\.pdf$/i, ""),
          descripcion:
            "Detectado en Google Drive. Pendiente de aprobación administrativa.",
          ...metadata,
          asignatura: null,
          tipo: "PDF",
          drive_file_id: archivo.id,
          portada_url: null,
          activo: false,
        });
      }
    }

    for (let i = 0; i < nuevos.length; i += 100) {
      const lote = nuevos.slice(i, i + 100);

      const { data, error } = await supabaseAdmin
        .from("biblioteca_materiales")
        .insert(lote)
        .select("id");

      if (error) {
        throw new Error(
          `No se pudo registrar un grupo de materiales: ${error.message}`
        );
      }

      nuevosRegistrados += data?.length ?? 0;
    }

    return NextResponse.json({
      success: true,
      message: "Sincronización y clasificación de Biblioteca MR completadas.",
      totalDetectados: archivos.length,
      nuevosRegistrados,
      existentes: archivos.length - nuevosRegistrados,
      actualizados,
      pendientesDeAprobacion: nuevosRegistrados,
      publicacionesModificadas: 0,
    });
  } catch (error) {
    console.error("Error sincronizando Biblioteca MR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error durante la sincronización.",
      },
      { status: 500 }
    );
  }
}
