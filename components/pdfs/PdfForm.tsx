"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Modulo = {
  id: string;
  titulo: string;
  orden: number;
  activo: boolean;
};

export default function PdfForm() {
  const searchParams = useSearchParams();
  const moduloIdUrl = searchParams.get("modulo_id");

  const [titulo, setTitulo] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [moduloId, setModuloId] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [cargandoModulos, setCargandoModulos] = useState(true);

  useEffect(() => {
    cargarModulos();
  }, []);

  useEffect(() => {
    if (moduloIdUrl && modulos.length > 0) {
      const moduloExiste = modulos.some(
        (modulo) => modulo.id === moduloIdUrl
      );

      if (moduloExiste) {
        setModuloId(moduloIdUrl);
      }
    }
  }, [moduloIdUrl, modulos]);

  async function cargarModulos() {
    try {
      setCargandoModulos(true);

      const { data, error } = await supabase
        .from("modulos")
        .select("id, titulo, orden, activo")
        .order("orden");

      if (error) {
        console.error("Error cargando módulos:", error);
        alert(error.message);
        return;
      }

      const lista = data || [];

      setModulos(lista);

      if (moduloIdUrl) {
        const moduloExiste = lista.some(
          (modulo) => modulo.id === moduloIdUrl
        );

        if (moduloExiste) {
          setModuloId(moduloIdUrl);
          return;
        }
      }

      if (lista.length > 0) {
        setModuloId(lista[0].id);
      }
    } finally {
      setCargandoModulos(false);
    }
  }

  async function guardarPdf() {
    if (!titulo.trim() || !archivo || !moduloId) {
      alert("Complete todos los campos.");
      return;
    }

    if (archivo.type !== "application/pdf") {
      alert("Seleccione un archivo PDF válido.");
      return;
    }

    setSubiendo(true);

    try {
      const extension = archivo.name.split(".").pop()?.toLowerCase() || "pdf";

      const nombreLimpio = titulo
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "_");

      const nombreArchivo =
        `${Date.now()}_${nombreLimpio}.${extension}`;

      console.log("========== PDF ==========");
      console.log("Título:", titulo);
      console.log("Archivo:", nombreArchivo);
      console.log("Modulo:", moduloId);

      const upload = await supabase.storage
        .from("materiales")
        .upload(`pdfs/${nombreArchivo}`, archivo, {
          upsert: true,
        });

      if (upload.error) {
        console.error(upload.error);
        alert(upload.error.message);
        return;
      }

      const publicUrl = supabase.storage
        .from("materiales")
        .getPublicUrl(`pdfs/${nombreArchivo}`);

      const insert = await supabase
        .from("pdfs")
        .insert({
          titulo: titulo.trim(),
          archivo: nombreArchivo,
          url: publicUrl.data.publicUrl,
          modulo_id: moduloId,
          activo: true,
        })
        .select()
        .single();

      if (insert.error) {
        console.error(insert.error);

        await supabase.storage
          .from("materiales")
          .remove([`pdfs/${nombreArchivo}`]);

        alert(insert.error.message);
        return;
      }

      alert("PDF guardado correctamente.");

      setTitulo("");
      setArchivo(null);

      const inputArchivo = document.getElementById(
        "pdf-archivo"
      ) as HTMLInputElement | null;

      if (inputArchivo) {
        inputArchivo.value = "";
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Error inesperado al guardar el PDF.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          📄 Subir PDF
        </h2>

        <p className="text-gray-500 mt-2">
          Agrega material de estudio y asígnalo al módulo correspondiente.
        </p>
      </div>

      <label className="block font-semibold mb-2">
        Título
      </label>

      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="border rounded-lg w-full p-3 mb-6"
        placeholder="Título del PDF"
      />

      <label className="block font-semibold mb-2">
        PDF
      </label>

      <input
        id="pdf-archivo"
        type="file"
        accept=".pdf,application/pdf"
        onChange={(e) =>
          setArchivo(
            e.target.files && e.target.files.length > 0
              ? e.target.files[0]
              : null
          )
        }
        className="border rounded-lg w-full p-3 mb-6"
      />

      <label className="block font-semibold mb-2">
        Módulo
      </label>

      <select
        value={moduloId}
        onChange={(e) => setModuloId(e.target.value)}
        disabled={cargandoModulos || subiendo}
        className="border rounded-lg w-full p-3 mb-6 disabled:bg-gray-100"
      >
        <option value="">
          Seleccione un módulo
        </option>

        {modulos.map((modulo) => (
          <option
            key={modulo.id}
            value={modulo.id}
          >
            {modulo.orden}. {modulo.titulo}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={guardarPdf}
        disabled={subiendo || cargandoModulos}
        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-bold transition"
      >
        {subiendo ? "Subiendo..." : "Guardar PDF"}
      </button>
    </div>
  );
}