"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PdfList() {
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPdfs();
  }, []);

  async function cargarPdfs() {
    const { data, error } = await supabase
      .from("pdfs")
      .select(`
        *,
        modulos (
          titulo
        )
      `)
      .order("orden");

    if (error) {
      alert(error.message);
      return;
    }

    setPdfs(data || []);
    setCargando(false);
  }

  async function eliminarPdf(id: string, archivo: string) {

    if (!confirm("¿Desea eliminar este PDF?")) return;

    const { error } = await supabase
      .from("pdfs")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await supabase.storage
      .from("materiales")
      .remove([`pdfs/${archivo}`]);

    cargarPdfs();
  }

  if (cargando) {
    return (
      <div className="mt-12">
        Cargando PDFs...
      </div>
    );
  }

  return (
    <div className="mt-12">

      <h2 className="text-2xl font-bold mb-6">
        PDFs registrados
      </h2>

      <div className="space-y-4">

        {pdfs.map((pdf) => (

          <div
            key={pdf.id}
            className="bg-white rounded-xl shadow p-6 flex justify-between items-center"
          >

            <div>

              <h3 className="font-bold text-lg">
                📄 {pdf.titulo}
              </h3>

              <p className="text-gray-600">
                {pdf.modulos?.titulo}
              </p>

            </div>

            <div className="flex gap-3">

              <a
                href={pdf.url}
                target="_blank"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Ver PDF
              </a>

              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
              >
                Editar
              </button>

              <button
                onClick={() => eliminarPdf(pdf.id, pdf.archivo)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Eliminar
              </button>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}