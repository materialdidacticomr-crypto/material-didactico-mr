import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "El ID del módulo es obligatorio." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("modulos")
      .select("id, titulo, descripcion, orden, activo, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error obteniendo módulo:", error);

      return NextResponse.json(
        { error: "No se pudo obtener el módulo." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "El módulo no existe." },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error inesperado obteniendo módulo:", error);

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "El ID del módulo es obligatorio." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const titulo =
      typeof body.titulo === "string"
        ? body.titulo.trim()
        : "";

    const descripcion =
      typeof body.descripcion === "string"
        ? body.descripcion.trim()
        : null;

    const orden =
      typeof body.orden === "number"
        ? body.orden
        : Number(body.orden);

    const activo =
      typeof body.activo === "boolean"
        ? body.activo
        : true;

    if (!titulo) {
      return NextResponse.json(
        { error: "El título del módulo es obligatorio." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(orden)) {
      return NextResponse.json(
        { error: "El orden del módulo no es válido." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("modulos")
      .update({
        titulo,
        descripcion,
        orden,
        activo,
      })
      .eq("id", id)
      .select("id, titulo, descripcion, orden, activo, created_at")
      .maybeSingle();

    if (error) {
      console.error("Error actualizando módulo:", error);

      return NextResponse.json(
        { error: "No se pudo actualizar el módulo." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "El módulo no existe." },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error inesperado actualizando módulo:", error);

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "El ID del módulo es obligatorio." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("modulos")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Error eliminando módulo:", error);

      return NextResponse.json(
        { error: "No se pudo eliminar el módulo." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "El módulo no existe." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Módulo eliminado correctamente.",
    });
  } catch (error) {
    console.error("Error inesperado eliminando módulo:", error);

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}