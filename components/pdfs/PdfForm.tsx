"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PdfForm() {
  const [titulo, setTitulo] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [modulos, setModulos] = useState<any[]>([]);
  const [moduloId, setModuloId] = useState("");
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    cargarModulos();
  }, []);

  async function cargarModulos() {
    const { data, error } = await supabase
      .from("modulos")
      .select("*")
      .order("orden");

    if (error) {
      console.error("Error cargando módulos:", error);
      alert(error.message);
      return;
    }

    if (data) {
      setModulos(data);

      if (data.length > 0) {
        setModuloId(data[0].id);
      }
    }
  }

  async function guardarPdf() {

    if (!titulo || !archivo || !moduloId) {
      alert("Complete todos los campos.");
      return;
    }

    setSubiendo(true);

    try {

      const extension = archivo.name.split(".").pop();

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

      console.log("UPLOAD");
      console.log(upload);

      if (upload.error) {

        console.error(upload.error);

        alert(upload.error.message);

        setSubiendo(false);

        return;

      }

      const publicUrl = supabase.storage
        .from("materiales")
        .getPublicUrl(`pdfs/${nombreArchivo}`);

      console.log("PUBLIC URL");
      console.log(publicUrl);

      const insert = await supabase
        .from("pdfs")
        .insert({
          titulo: titulo,
          archivo: nombreArchivo,
          url: publicUrl.data.publicUrl,
          modulo_id: moduloId,
          activo: true,
        })
        .select();

      console.log("INSERT");
      console.log(insert);

      if (insert.error) {

        console.error(insert.error);

        alert(insert.error.message);

        setSubiendo(false);

        return;

      }

      alert("PDF guardado correctamente.");

      setTitulo("");
      setArchivo(null);

      window.location.reload();

    } catch (e) {

      console.error(e);

      alert("Error inesperado.");

    } finally {

      setSubiendo(false);

    }

  }

  return (
    <div className="bg-white rounded-xl shadow p-8">

      <label className="block font-semibold mb-2">
        Título
      </label>

      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="border rounded-lg w-full p-3 mb-6"
      />

      <label className="block font-semibold mb-2">
        PDF
      </label>

      <input
        type="file"
        accept=".pdf"
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
        className="border rounded-lg w-full p-3 mb-6"
      >
        {modulos.map((m) => (
          <option
            key={m.id}
            value={m.id}
          >
            {m.titulo}
          </option>
        ))}
      </select>

      <button
        onClick={guardarPdf}
        disabled={subiendo}
        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-bold"
      >
        {subiendo ? "Subiendo..." : "Guardar PDF"}
      </button>

    </div>
  );
}