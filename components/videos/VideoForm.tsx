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

export default function VideoForm() {
  const searchParams = useSearchParams();
  const moduloIdUrl = searchParams.get("modulo_id");

  const [titulo, setTitulo] = useState("");
  const [youtube, setYoutube] = useState("");
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [moduloId, setModuloId] = useState("");
  const [guardando, setGuardando] = useState(false);
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

  function validarYoutube(url: string) {
    try {
      const urlNormalizada = url.trim();

      const urlObj = new URL(urlNormalizada);

      return (
        urlObj.hostname.includes("youtube.com") ||
        urlObj.hostname.includes("youtu.be")
      );
    } catch {
      return false;
    }
  }

  async function guardarVideo() {
    const tituloLimpio = titulo.trim();
    const youtubeLimpio = youtube.trim();

    if (!tituloLimpio || !youtubeLimpio || !moduloId) {
      alert("Complete todos los campos.");
      return;
    }

    if (!validarYoutube(youtubeLimpio)) {
      alert("Ingrese un enlace válido de YouTube.");
      return;
    }

    setGuardando(true);

    try {
      const { error } = await supabase
        .from("videos")
        .insert({
          titulo: tituloLimpio,
          youtube_url: youtubeLimpio,
          modulo_id: moduloId,
          activo: true,
        });

      if (error) {
        console.error("Error guardando video:", error);
        alert(error.message);
        return;
      }

      alert("Video guardado correctamente.");

      setTitulo("");
      setYoutube("");

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Error inesperado al guardar el video.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          🎥 Agregar video
        </h2>

        <p className="text-gray-500 mt-2">
          Agrega un video de YouTube y asígnalo al módulo correspondiente.
        </p>
      </div>

      <label className="block font-semibold mb-2">
        Título
      </label>

      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="border rounded-lg w-full p-3 mb-6"
        placeholder="Título del video"
        disabled={guardando}
      />

      <label className="block font-semibold mb-2">
        Enlace de YouTube
      </label>

      <input
        value={youtube}
        onChange={(e) => setYoutube(e.target.value)}
        className="border rounded-lg w-full p-3 mb-6"
        placeholder="https://www.youtube.com/watch?v=..."
        disabled={guardando}
      />

      <label className="block font-semibold mb-2">
        Módulo
      </label>

      <select
        value={moduloId}
        onChange={(e) => setModuloId(e.target.value)}
        disabled={cargandoModulos || guardando}
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
        onClick={guardarVideo}
        disabled={guardando || cargandoModulos}
        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-bold transition"
      >
        {guardando ? "Guardando..." : "Guardar Video"}
      </button>
    </div>
  );
}