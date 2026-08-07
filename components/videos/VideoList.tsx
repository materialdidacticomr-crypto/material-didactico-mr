"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function VideoList() {
  const [videos, setVideos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarVideos();
  }, []);

  async function cargarVideos() {
    const { data } = await supabase
      .from("videos")
      .select(`
        *,
        modulos (
          titulo
        )
      `)
      .order("orden");

    setVideos(data || []);
    setCargando(false);
  }

  async function eliminarVideo(id: string) {
    const confirmar = confirm("¿Desea eliminar este video?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("videos")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    cargarVideos();
  }

  if (cargando) {
    return <p>Cargando videos...</p>;
  }

  return (
    <div className="mt-12">

      <h2 className="text-2xl font-bold mb-6">
        Videos registrados
      </h2>

      <div className="space-y-4">

        {videos.map((video) => (

          <div
            key={video.id}
            className="bg-white rounded-xl shadow p-6 flex justify-between items-center"
          >

            <div>

              <h3 className="font-bold text-lg">
                {video.titulo}
              </h3>

              <p className="text-gray-600">
                {video.modulos?.titulo}
              </p>

            </div>

            <div className="flex gap-3">

              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
              >
                Editar
              </button>

              <button
                onClick={() => eliminarVideo(video.id)}
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