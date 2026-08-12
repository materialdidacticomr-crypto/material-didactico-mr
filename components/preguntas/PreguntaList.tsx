"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Pregunta = {
  id: string;
  modulo_id: string;
  pregunta: string;
  opcion_a: string;
  opcion_b: string;
  opcion_c: string;
  opcion_d: string;
  respuesta_correcta: string;
  explicacion: string | null;
  activo: boolean;
  orden?: number;
  created_at?: string;
  modulos?: {
    titulo: string;
  } | null;
};

export default function PreguntaList() {
  const searchParams = useSearchParams();
  const moduloId = searchParams.get("modulo_id");

  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarPreguntas();
  }, [moduloId]);

  async function cargarPreguntas() {
    try {
      setCargando(true);
      setError("");

      let consulta = supabase
        .from("preguntas")
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
        console.error("Error cargando preguntas:", error);
        setError(error.message);
        return;
      }

      setPreguntas(data || []);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las preguntas."
      );
    } finally {
      setCargando(false);
    }
  }

  async function eliminarPregunta(id: string) {
    if (!confirm("¿Desea eliminar esta pregunta?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("preguntas")
        .delete()
        .eq("id", id);

      if (error) {
        alert(error.message);
        return;
      }

      await cargarPreguntas();
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar la pregunta.");
    }
  }

  if (cargando) {
    return (
      <div className="mt-10 bg-white rounded-xl shadow p-8">
        <div className="text-center text-gray-500">
          ⏳ Cargando preguntas...
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
              📝 Banco de Preguntas
            </h2>

            <p className="text-gray-500 mt-1">
              {moduloId
                ? "Estas son las preguntas asociadas al módulo seleccionado."
                : "Estas son todas las preguntas registradas."}
            </p>
          </div>

          <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full font-bold">
            {preguntas.length} pregunta
            {preguntas.length !== 1 ? "s" : ""}
          </span>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            ⚠️ {error}
          </div>
        )}

        {preguntas.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
            <div className="text-5xl mb-4">
              📝
            </div>

            <h3 className="text-xl font-bold text-gray-700">
              No hay preguntas en este módulo
            </h3>

            <p className="text-gray-500 mt-2">
              Cuando agregues una pregunta y la asignes a este módulo,
              aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {preguntas.map((pregunta) => (
              <div
                key={pregunta.id}
                className="bg-gray-50 border border-gray-200 rounded-xl shadow-sm p-6"
              >
                <div className="flex flex-col xl:flex-row xl:justify-between xl:items-start gap-6">
                  <div className="flex-1">
                    <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                      {pregunta.modulos?.titulo || "Sin módulo"}
                    </span>

                    <h3 className="font-bold text-lg mb-5 text-gray-800">
                      {pregunta.pregunta}
                    </h3>

                    <div className="grid md:grid-cols-2 gap-3 text-gray-700">
                      <p>
                        <strong>A.</strong>{" "}
                        {pregunta.opcion_a}
                      </p>

                      <p>
                        <strong>B.</strong>{" "}
                        {pregunta.opcion_b}
                      </p>

                      <p>
                        <strong>C.</strong>{" "}
                        {pregunta.opcion_c}
                      </p>

                      <p>
                        <strong>D.</strong>{" "}
                        {pregunta.opcion_d}
                      </p>
                    </div>

                    <div className="mt-5">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-semibold">
                        Correcta:{" "}
                        {pregunta.respuesta_correcta}
                      </span>
                    </div>

                    {pregunta.explicacion && (
                      <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                        <strong>
                          Explicación:
                        </strong>

                        <p className="mt-2 text-gray-700">
                          {pregunta.explicacion}
                        </p>
                      </div>
                    )}

                    <div className="mt-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-bold ${
                          pregunta.activo
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {pregunta.activo
                          ? "Activa"
                          : "Inactiva"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 xl:ml-6">
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
                        eliminarPregunta(
                          pregunta.id
                        )
                      }
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                    >
                      Eliminar
                    </button>
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