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

export default function RecursoForm() {
  const searchParams = useSearchParams();
  const moduloIdUrl = searchParams.get("modulo_id");

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("PDF");
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

  async function guardarRecurso() {
    const tituloLimpio = titulo.trim();
    const descripcionLimpia = descripcion.trim();

    if (!tituloLimpio || !archivo || !moduloId) {
      alert("Complete todos los campos obligatorios.");
      return;
    }

    setSubiendo(true);

    try {
      const extension =
        archivo.name.split(".").pop()?.toLowerCase() || "";

      const nombreLimpio = tituloLimpio
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "_");

      const nombreArchivo = extension
        ? `${Date.now()}_${nombreLimpio}.${extension}`
        : `${Date.now()}_${nombreLimpio}`;

      const upload = await supabase.storage
        .from("materiales")
        .upload(`recursos/${nombreArchivo}`, archivo, {
          upsert: true,
        });

      if (upload.error) {
        console.error("Error subiendo recurso:", upload.error);
        alert(upload.error.message);
        return;
      }

      const publicUrl = supabase.storage
        .from("materiales")
        .getPublicUrl(`recursos/${nombreArchivo}`);

      const insert = await supabase
        .from("recursos")
        .insert({
          titulo: tituloLimpio,
          descripcion: descripcionLimpia,
          tipo,
          archivo: nombreArchivo,
          url: publicUrl.data.publicUrl,
          modulo_id: moduloId,
          activo: true,
        })
        .select()
        .single();

      if (insert.error) {
        console.error("Error guardando recurso:", insert.error);

        await supabase.storage
          .from("materiales")
          .remove([`recursos/${nombreArchivo}`]);

        alert(insert.error.message);
        return;
      }

      alert("Recurso guardado correctamente.");

      setTitulo("");
      setDescripcion("");
      setArchivo(null);

      const inputArchivo = document.getElementById(
        "recurso-archivo"
      ) as HTMLInputElement | null;

      if (inputArchivo) {
        inputArchivo.value = "";
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Error inesperado al guardar el recurso.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          📚 Agregar recurso
        </h2>

        <p className="text-gray-500 mt-2">
          Agrega material complementario y asígnalo al módulo correspondiente.
        </p>
      </div>

      <label className="block font-semibold mb-2">
        Título
      </label>

      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="border rounded-lg w-full p-3 mb-6"
        placeholder="Título del recurso"
        disabled={subiendo}
      />

      <label className="block font-semibold mb-2">
        Descripción
      </label>

      <textarea
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        className="border rounded-lg w-full p-3 mb-6"
        rows={4}
        placeholder="Descripción del recurso"
        disabled={subiendo}
      />

      <label className="block font-semibold mb-2">
        Tipo de recurso
      </label>

      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        disabled={subiendo}
        className="border rounded-lg w-full p-3 mb-6 disabled:bg-gray-100"
      >
        <option value="PDF">PDF</option>
        <option value="Word">Word</option>
        <option value="Excel">Excel</option>
        <option value="PowerPoint">PowerPoint</option>
        <option value="Imagen">Imagen</option>
        <option value="ZIP">ZIP</option>
      </select>

      <label className="block font-semibold mb-2">
        Archivo
      </label>

      <input
        id="recurso-archivo"
        type="file"
        onChange={(e) =>
          setArchivo(
            e.target.files && e.target.files.length > 0
              ? e.target.files[0]
              : null
          )
        }
        className="border rounded-lg w-full p-3 mb-6"
        disabled={subiendo}
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
        onClick={guardarRecurso}
        disabled={subiendo || cargandoModulos}
        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-bold transition"
      >
        {subiendo ? "Subiendo..." : "Guardar Recurso"}
      </button>
    </div>
  );
}