"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Video = {
  id: string;
  titulo: string;
  youtube_url: string;
  modulo_id: string;
  activo: boolean;
  orden?: number;
  created_at?: string;
  modulos?: {
    titulo: string;
  } | null;
};

export default function VideoList() {
  const searchParams = useSearchParams();
  const moduloId = searchParams.get("modulo_id");

  const [videos, setVideos] = useState<Video[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarVideos();
  }, [moduloId]);

  async function cargarVideos() {
    try {
      setCargando(true);
      setError("");

      let consulta = supabase
        .from("videos")
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
        console.error("Error cargando videos:", error);
        setError(error.message);
        return;
      }

      setVideos(data || []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los videos."
      );
    } finally {
      setCargando(false);
    }
  }

  async function eliminarVideo(id: string) {
    const confirmar = confirm(
      "¿Desea eliminar este video?"
    );

    if (!confirmar) {
      return;
    }

    try {
      const { error } = await supabase
        .from("videos")
        .delete()
        .eq("id", id);

      if (error) {
        alert(error.message);
        return;
      }

      await cargarVideos();
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar el video.");
    }
  }

  function abrirVideo(url: string) {
    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  if (cargando) {
    return (
      <div className="mt-12 bg-white rounded-xl shadow p-8">
        <div className="text-center text-gray-500">
          ⏳ Cargando videos...
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
              🎥 Videos registrados
            </h2>

            <p className="text-gray-500 mt-1">
              {moduloId
                ? "Estos son los videos asociados al módulo seleccionado."
                : "Estos son todos los videos registrados."}
            </p>
          </div>

          <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full font-bold">
            {videos.length} video{videos.length !== 1 ? "s" : ""}
          </span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            ⚠️ {error}
          </div>
        )}

        {videos.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
            <div className="text-5xl mb-4">
              🎥
            </div>

            <h3 className="text-xl font-bold text-gray-700">
              No hay videos en este módulo
            </h3>

            <p className="text-gray-500 mt-2">
              Cuando agregues un video y lo asignes a este módulo,
              aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-5"
              >
                <div className="min-w-0">
                  <h3 className="font-bold text-lg text-gray-800">
                    🎥 {video.titulo}
                  </h3>

                  <p className="text-gray-600 mt-1">
                    Módulo:{" "}
                    <span className="font-semibold">
                      {video.modulos?.titulo || "Sin módulo"}
                    </span>
                  </p>

                  <p className="text-sm text-gray-400 mt-1 break-all">
                    {video.youtube_url}
                  </p>

                  <div className="mt-2">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-sm font-bold ${
                        video.activo
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {video.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      abrirVideo(video.youtube_url)
                    }
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                  >
                    Ver video
                  </button>

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
                      eliminarVideo(video.id)
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