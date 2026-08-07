"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PreguntaList() {

  const [preguntas, setPreguntas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPreguntas();
  }, []);

  async function cargarPreguntas() {

    const { data, error } = await supabase
      .from("preguntas")
      .select(`
        *,
        modulos (
          titulo
        )
      `)
      .order("orden");

    if (error) {
      alert(error.message);
      return;
    }

    setPreguntas(data || []);
    setCargando(false);

  }

  async function eliminarPregunta(id: string) {

    if (!confirm("¿Desea eliminar esta pregunta?")) return;

    const { error } = await supabase
      .from("preguntas")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    cargarPreguntas();

  }

  if (cargando) {

    return (
      <div className="mt-10">
        Cargando preguntas...
      </div>
    );

  }

  return (

    <div className="mt-12">

      <h2 className="text-2xl font-bold mb-6">
        Banco de Preguntas
      </h2>

      <div className="space-y-4">

        {preguntas.map((pregunta) => (

          <div
            key={pregunta.id}
            className="bg-white rounded-xl shadow p-6"
          >

            <div className="flex justify-between items-start">

              <div className="flex-1">

                <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                  {pregunta.modulos?.titulo}
                </span>

                <h3 className="font-bold text-lg mb-4">
                  {pregunta.pregunta}
                </h3>

                <div className="grid md:grid-cols-2 gap-3 text-gray-700">

                  <p>
                    <strong>A.</strong> {pregunta.opcion_a}
                  </p>

                  <p>
                    <strong>B.</strong> {pregunta.opcion_b}
                  </p>

                  <p>
                    <strong>C.</strong> {pregunta.opcion_c}
                  </p>

                  <p>
                    <strong>D.</strong> {pregunta.opcion_d}
                  </p>

                </div>

                <div className="mt-5">

                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-semibold">
                    Correcta: {pregunta.respuesta_correcta}
                  </span>

                </div>

                {pregunta.explicacion && (

                  <div className="mt-4 p-4 bg-gray-100 rounded-lg">

                    <strong>Explicación:</strong>

                    <p className="mt-2">
                      {pregunta.explicacion}
                    </p>

                  </div>

                )}

              </div>

              <div className="flex gap-3 ml-6">

                <button
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
                >
                  Editar
                </button>

                <button
                  onClick={() => eliminarPregunta(pregunta.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  Eliminar
                </button>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}