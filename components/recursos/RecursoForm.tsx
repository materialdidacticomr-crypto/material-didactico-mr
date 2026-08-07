"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RecursoForm() {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("PDF");
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
      alert(error.message);
      return;
    }

    setModulos(data || []);

    if (data && data.length > 0) {
      setModuloId(data[0].id);
    }
  }

  async function guardarRecurso() {

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

      const upload = await supabase.storage
        .from("materiales")
        .upload(`recursos/${nombreArchivo}`, archivo, {
          upsert: true,
        });

      if (upload.error) {
        alert(upload.error.message);
        return;
      }

      const publicUrl = supabase.storage
        .from("materiales")
        .getPublicUrl(`recursos/${nombreArchivo}`);

      const insert = await supabase
        .from("recursos")
        .insert({
          titulo,
          descripcion,
          tipo,
          archivo: nombreArchivo,
          url: publicUrl.data.publicUrl,
          modulo_id: moduloId,
          activo: true,
        });

      if (insert.error) {
        alert(insert.error.message);
        return;
      }

      alert("Recurso guardado correctamente.");

      setTitulo("");
      setDescripcion("");
      setArchivo(null);

      window.location.reload();

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
        Descripción
      </label>

      <textarea
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        className="border rounded-lg w-full p-3 mb-6"
      />

      <label className="block font-semibold mb-2">
        Tipo de recurso
      </label>

      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        className="border rounded-lg w-full p-3 mb-6"
      >
        <option>PDF</option>
        <option>Word</option>
        <option>Excel</option>
        <option>PowerPoint</option>
        <option>Imagen</option>
        <option>ZIP</option>
      </select>

      <label className="block font-semibold mb-2">
        Archivo
      </label>

      <input
        type="file"
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
          <option key={m.id} value={m.id}>
            {m.titulo}
          </option>
        ))}
      </select>

      <button
        onClick={guardarRecurso}
        disabled={subiendo}
        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-bold"
      >
        {subiendo ? "Subiendo..." : "Guardar Recurso"}
      </button>

    </div>

  );

}