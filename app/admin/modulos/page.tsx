"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Modulo = {
  id: string;
  titulo: string;
  descripcion: string | null;
  orden: number;
  activo: boolean;
};

export default function ModulosAdmin() {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarModulos() {
      setCargando(true);
      setError("");

      const { data, error } = await supabaseBrowser
        .from("modulos")
        .select("id, titulo, descripcion, orden, activo")
        .eq("activo", true)
        .order("orden", { ascending: true });

      if (error) {
        console.error("Error cargando módulos:", error);
        setError("No se pudieron cargar los módulos.");
        setCargando(false);
        return;
      }

      setModulos(data ?? []);
      setCargando(false);
    }

    cargarModulos();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">
          📚 Módulos
        </h1>

        <p className="text-gray-500 mt-2">
          Administra los módulos del curso de Material Didáctico MR Academy.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Módulos del curso
            </h2>

            <p className="text-gray-500 mt-1">
              Módulos disponibles en la plataforma.
            </p>
          </div>
        </div>

        {cargando && (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
            <div className="text-4xl mb-4">⏳</div>

            <p className="text-gray-500">
              Cargando módulos...
            </p>
          </div>
        )}

        {!cargando && error && (
          <div className="border-2 border-red-200 bg-red-50 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">⚠️</div>

            <p className="font-bold text-red-700">
              {error}
            </p>
          </div>
        )}

        {!cargando && !error && modulos.length === 0 && (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
            <div className="text-5xl mb-4">📚</div>

            <h3 className="text-xl font-bold text-gray-700">
              No hay módulos activos
            </h3>

            <p className="text-gray-500 mt-2">
              Los módulos aparecerán aquí cuando estén registrados en la
              plataforma.
            </p>
          </div>
        )}

        {!cargando && !error && modulos.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {modulos.map((modulo) => (
              <div
                key={modulo.id}
                className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">
                    📚
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xl font-bold text-gray-800">
                        {modulo.titulo}
                      </h3>

                      <span className="text-sm font-bold text-purple-600">
                        #{modulo.orden}
                      </span>
                    </div>

                    <p className="text-gray-500 mt-2">
                      {modulo.descripcion}
                    </p>

                    <div className="mt-4">
                      <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                        Activo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}