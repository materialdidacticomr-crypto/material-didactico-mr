"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RecursoList() {

  const [recursos, setRecursos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarRecursos();
  }, []);

  async function cargarRecursos() {

    const { data, error } = await supabase
      .from("recursos")
      .select(`
        *,
        modulos(
          titulo
        )
      `)
      .order("orden");

    if (error) {
      alert(error.message);
      return;
    }

    setRecursos(data || []);
    setCargando(false);

  }

  async function eliminarRecurso(id: string, archivo: string) {

    if (!confirm("¿Desea eliminar este recurso?")) return;

    const { error } = await supabase
      .from("recursos")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await supabase.storage
      .from("materiales")
      .remove([`recursos/${archivo}`]);

    cargarRecursos();

  }

  if (cargando) {
    return (
      <div className="mt-12">
        Cargando recursos...
      </div>
    );
  }

  return (

    <div className="mt-12">

      <h2 className="text-2xl font-bold mb-6">
        Recursos registrados
      </h2>

      <div className="space-y-4">

        {recursos.map((recurso) => (

          <div
            key={recurso.id}
            className="bg-white rounded-xl shadow p-6 flex justify-between items-center"
          >

            <div>

              <h3 className="font-bold text-lg">
                📚 {recurso.titulo}
              </h3>

              <p className="text-gray-500">
                {recurso.descripcion}
              </p>

              <p className="text-gray-600">
                {recurso.modulos?.titulo}
              </p>

              <span className="text-sm bg-gray-200 rounded px-2 py-1">
                {recurso.tipo}
              </span>

            </div>

            <div className="flex gap-3">

              <a
                href={recurso.url}
                target="_blank"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Ver
              </a>

              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
              >
                Editar
              </button>

              <button
                onClick={() =>
                  eliminarRecurso(recurso.id, recurso.archivo)
                }
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