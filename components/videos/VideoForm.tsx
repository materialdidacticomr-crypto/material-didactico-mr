"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function VideoForm() {
  const [titulo, setTitulo] = useState("");
  const [youtube, setYoutube] = useState("");
  const [modulos, setModulos] = useState<any[]>([]);
  const [moduloId, setModuloId] = useState("");

  useEffect(() => {
    cargarModulos();
  }, []);

  async function cargarModulos() {
    const { data } = await supabase
      .from("modulos")
      .select("*")
      .order("orden");

    if (data) {
      setModulos(data);

      if (data.length > 0) {
        setModuloId(data[0].id);
      }
    }
  }

  async function guardarVideo() {
    if (!titulo || !youtube) {
      alert("Complete todos los campos");
      return;
    }

    const { error } = await supabase
      .from("videos")
      .insert({
        titulo,
        youtube_url: youtube,
        modulo_id: moduloId,
      });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Video guardado correctamente");

    setTitulo("");
    setYoutube("");

    window.location.reload();
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
        Link de YouTube
      </label>

      <input
        value={youtube}
        onChange={(e) => setYoutube(e.target.value)}
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
        onClick={guardarVideo}
        className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold"
      >
        Guardar Video
      </button>

    </div>
  );
}