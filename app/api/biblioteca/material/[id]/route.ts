import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { obtenerArchivoDrive } from "@/lib/google-drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<unknown> }
) {
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
        { error: "No tenés permisos para visualizar este material." },
        { status: 403 }
      );
    }

    const routeParams = await context.params;

    if (
      !routeParams ||
      typeof routeParams !== "object" ||
      !("id" in routeParams) ||
      typeof routeParams.id !== "string" ||
      routeParams.id.trim() === ""
    ) {
      return NextResponse.json(
        { error: "El identificador del material no es válido." },
        { status: 400 }
      );
    }

    const id = routeParams.id;

    const { data: material, error: errorMaterial } = await supabaseAdmin
      .from("biblioteca_materiales")
      .select("id, titulo, tipo, drive_file_id, activo")
      .eq("id", id)
      .eq("activo", true)
      .maybeSingle();

    if (errorMaterial) {
      console.error("Error consultando material:", errorMaterial);
      return NextResponse.json(
        { error: "No se pudo consultar el material solicitado." },
        { status: 500 }
      );
    }

    if (!material || !material.drive_file_id) {
      return NextResponse.json(
        { error: "El material no está publicado o no tiene un PDF vinculado." },
        { status: 404 }
      );
    }

    if (material.tipo && material.tipo.toLowerCase() !== "pdf") {
      return NextResponse.json(
        { error: "Este visor está disponible únicamente para documentos PDF." },
        { status: 415 }
      );
    }

    const archivoOriginal = await obtenerArchivoDrive(material.drive_file_id);
    const pdf = await PDFDocument.load(archivoOriginal);
    const fuente = await pdf.embedFont(StandardFonts.Helvetica);
    const paginas = pdf.getPages();

    for (const pagina of paginas) {
      const { width, height } = pagina.getSize();
      const texto = "MATERIAL DIDÁCTICO MR";
      const tamano = Math.min(30, Math.max(18, width * 0.045));
      const anchoTexto = fuente.widthOfTextAtSize(texto, tamano);

      pagina.drawText(texto, {
        x: Math.max(12, (width - anchoTexto) / 2),
        y: height / 2,
        size: tamano,
        font: fuente,
        color: rgb(0.82, 0.78, 0.82),
        rotate: degrees(32),
      });

      pagina.drawText("BIBLIOTECA MR · COPIA DE CONSULTA", {
        x: 18,
        y: 16,
        size: 8,
        font: fuente,
        color: rgb(0.68, 0.64, 0.70),
      });
    }

    const pdfProtegido = await pdf.save();

    return new NextResponse(Buffer.from(pdfProtegido), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="material-biblioteca-mr.pdf"',
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error preparando PDF de Biblioteca MR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo preparar el documento para su visualización.",
      },
      { status: 500 }
    );
  }
}
