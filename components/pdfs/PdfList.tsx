"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Pdf = {
  id: string;
  titulo: string;
  archivo: string;
  url: string;
  modulo_id: string;
  activo: boolean;
  orden?: number;
  created_at?: string;
  modulos?: {
    titulo: string;
  } | null;
};

export default function PdfList() {
  const searchParams = useSearchParams();
  const moduloId = searchParams.get("modulo_id");

  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarPdfs();
  }, [moduloId]);

  async function cargarPdfs() {
    try {
      setCargando(true);
      setError("");

      let consulta = supabase
        .from("pdfs")
        .select(`
          *,
          modulos (
            titulo
          )
        `)
        .order("orden", { ascending: true });

      if (moduloId) {
        consulta = consulta.eq("modulo_id", moduloId);
      }

      const { data, error } = await consulta;

      if (error) {
        console.error("Error cargando PDFs:", error);
        setError(error.message);
        return;
      }

      setPdfs(data || []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los PDFs."
      );
    } finally {
      setCargando(false);
    }
  }

  async function eliminarPdf(
    id: string,
    archivo: string
  ) {
    if (!confirm("¿Desea eliminar este PDF?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("pdfs")
        .delete()
        .eq("id", id);

      if (error) {
        alert(error.message);
        return;
      }

      const { error: storageError } = await supabase.storage
        .from("materiales")
        .remove([`pdfs/${archivo}`]);

      if (storageError) {
        console.error(
          "El registro se eliminó, pero no se pudo eliminar el archivo:",
          storageError
        );
      }

      await cargarPdfs();
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar el PDF.");
    }
  }

  if (cargando) {
    return (
      <div className="mt-12 bg-white rounded-xl shadow p-8">
        <div className="text-center text-gray-500">
          ⏳ Cargando PDFs...
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <div className="bg-white rounded-xl shadow p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              📄 PDFs registrados
            </h2>

            <p className="text-gray-500 mt-1">
              {moduloId
                ? "Estos son los PDFs asociados al módulo seleccionado."
                : "Estos son todos los PDFs registrados."}
            </p>
          </div>

          <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full font-bold">
            {pdfs.length} PDF{pdfs.length !== 1 ? "s" : ""}
          </span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            ⚠️ {error}
          </div>
        )}

        {pdfs.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
            <div className="text-5xl mb-4">
              📄
            </div>

            <h3 className="text-xl font-bold text-gray-700">
              No hay PDFs en este módulo
            </h3>

            <p className="text-gray-500 mt-2">
              Cuando subas un PDF y lo asignes a este módulo,
              aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pdfs.map((pdf) => (
              <div
                key={pdf.id}
                className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-5"
              >
                <div className="min-w-0">
                  <h3 className="font-bold text-lg text-gray-800">
                    📄 {pdf.titulo}
                  </h3>

                  <p className="text-gray-600 mt-1">
                    Módulo:{" "}
                    <span className="font-semibold">
                      {pdf.modulos?.titulo || "Sin módulo"}
                    </span>
                  </p>

                  <p className="text-sm text-gray-400 mt-1 break-all">
                    {pdf.archivo}
                  </p>

                  <div className="mt-2">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-sm font-bold ${
                        pdf.activo
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {pdf.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                  >
                    Ver PDF
                  </a>

                  <button
                    type="button"
                    disabled
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold opacity-60 cursor-not-allowed"
                    title="La edición se activará en el siguiente paso"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      eliminarPdf(
                        pdf.id,
                        pdf.archivo
                      )
                    }
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}