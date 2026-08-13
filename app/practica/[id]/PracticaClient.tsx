"use client";

import Link from "next/link";
import { useState } from "react";

interface Pregunta {
  id: string;
  pregunta: string;
  opcion_a: string;
  opcion_b: string;
  opcion_c: string;
  opcion_d: string;
  respuesta_correcta: string;
  explicacion: string;
}

interface Props {
  modulo: any;
  preguntas: Pregunta[];
}

export default function PracticaClient({
  modulo,
  preguntas,
}: Props) {
  const [indice, setIndice] = useState(0);
  const [respuesta, setRespuesta] = useState("");
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [correctas, setCorrectas] = useState(0);

  if (preguntas.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-xl shadow-xl p-10 max-w-xl w-full">
          <h1 className="text-3xl font-bold mb-4 text-red-600">
            {modulo.titulo}
          </h1>

          <p className="text-gray-600">
            No hay preguntas disponibles para este módulo.
          </p>

          <Link
            href={`/campus/${modulo.id}`}
            className="inline-block mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold"
          >
            📚 Volver al módulo
          </Link>
        </div>
      </main>
    );
  }

  const pregunta = preguntas[indice];

  function responder(opcion: string) {
    if (mostrarResultado) return;

    setRespuesta(opcion);

    if (opcion === pregunta.respuesta_correcta) {
      setCorrectas((v) => v + 1);
    }

    setMostrarResultado(true);
  }

  function siguiente() {
    if (indice < preguntas.length - 1) {
      setIndice((v) => v + 1);
      setRespuesta("");
      setMostrarResultado(false);
    } else {
      setIndice(preguntas.length);
    }
  }

  function reiniciar() {
    setIndice(0);
    setRespuesta("");
    setMostrarResultado(false);
    setCorrectas(0);
  }

  /*
   * Pantalla final
   */
  if (indice >= preguntas.length) {
    const incorrectas = preguntas.length - correctas;

    const porcentaje = Math.round(
      (correctas / preguntas.length) * 100
    );

    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-xl w-full text-center">

          <div className="text-6xl mb-6">
            🎉
          </div>

          <h1 className="text-4xl font-bold text-red-600 mb-3">
            ¡Práctica finalizada!
          </h1>

          <p className="text-gray-600 text-lg mb-8">
            {modulo.titulo}
          </p>

          <div className="bg-gray-100 rounded-2xl p-6 mb-8">

            <p className="text-3xl font-bold text-gray-800 mb-6">
              {correctas} / {preguntas.length}
            </p>

            <div className="grid grid-cols-2 gap-4">

              <div className="bg-green-100 rounded-xl p-4">
                <p className="text-green-700 font-bold text-2xl">
                  {correctas}
                </p>

                <p className="text-green-700 font-semibold">
                  ✅ Correctas
                </p>
              </div>

              <div className="bg-red-100 rounded-xl p-4">
                <p className="text-red-700 font-bold text-2xl">
                  {incorrectas}
                </p>

                <p className="text-red-700 font-semibold">
                  ❌ Incorrectas
                </p>
              </div>

            </div>

            <div className="mt-5 bg-blue-100 rounded-xl p-5">

              <p className="text-blue-700 text-sm font-semibold">
                PORCENTAJE
              </p>

              <p className="text-4xl font-bold text-blue-700">
                {porcentaje}%
              </p>

            </div>

            <div className="mt-4 bg-yellow-100 rounded-xl p-5">

              <p className="text-yellow-700 text-sm font-semibold">
                CALIFICACIÓN
              </p>

              <p className="text-4xl font-bold text-yellow-700">
                {porcentaje} / 100
              </p>

            </div>

          </div>

          <div className="space-y-4">

            <button
              onClick={reiniciar}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg"
            >
              🔄 Intentar nuevamente
            </button>

            <Link
              href={`/campus/${modulo.id}`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg"
            >
              📚 Volver al módulo
            </Link>

          </div>

        </div>
      </main>
    );
  }

  const progreso =
    ((indice + 1) / preguntas.length) * 100;

  return (
    <main className="min-h-screen bg-gray-100">

      <div className="max-w-4xl mx-auto py-14 px-8">

        <h1 className="text-4xl font-bold text-red-600">
          {modulo.titulo}
        </h1>

        <div className="flex justify-between items-center mt-3">

          <p className="text-gray-600 font-semibold">
            Pregunta {indice + 1} de {preguntas.length}
          </p>

          <p className="text-gray-500 text-sm">
            {Math.round(progreso)}% completado
          </p>

        </div>

        <div className="w-full bg-gray-300 rounded-full h-3 mt-5 overflow-hidden">

          <div
            className="bg-red-600 h-3 rounded-full transition-all duration-300"
            style={{
              width: `${progreso}%`,
            }}
          />

        </div>

        <div className="bg-white rounded-2xl shadow-xl p-10 mt-10">

          <h2 className="text-2xl font-bold mb-8">
            {pregunta.pregunta}
          </h2>

          <div className="space-y-4">

            {[
              pregunta.opcion_a,
              pregunta.opcion_b,
              pregunta.opcion_c,
              pregunta.opcion_d,
            ].map((opcion, index) => {

              const letra = ["A", "B", "C", "D"][index];

              let clase =
                "w-full border rounded-xl p-4 text-left hover:bg-gray-100 transition";

              if (mostrarResultado) {

                if (letra === pregunta.respuesta_correcta) {

                  clase =
                    "w-full border rounded-xl p-4 text-left bg-green-100 border-green-600";

                } else if (letra === respuesta) {

                  clase =
                    "w-full border rounded-xl p-4 text-left bg-red-100 border-red-600";

                }

              }

              return (
                <button
                  key={letra}
                  type="button"
                  className={clase}
                  onClick={() => responder(letra)}
                >
                  <b>{letra})</b> {opcion}
                </button>
              );

            })}

          </div>

          {mostrarResultado && (

            <div className="mt-10">

              <div
                className={`rounded-xl p-6 ${
                  respuesta === pregunta.respuesta_correcta
                    ? "bg-green-100"
                    : "bg-red-100"
                }`}
              >

                <h3 className="text-xl font-bold mb-3">

                  {respuesta === pregunta.respuesta_correcta
                    ? "✅ Respuesta correcta"
                    : "❌ Respuesta incorrecta"}

                </h3>

                <p className="mb-2">
                  <b>Respuesta correcta:</b>{" "}
                  {pregunta.respuesta_correcta}
                </p>

                {pregunta.explicacion && (
                  <p>
                    {pregunta.explicacion}
                  </p>
                )}

              </div>

              <button
                type="button"
                onClick={siguiente}
                className="mt-8 w-full bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg"
              >
                {indice === preguntas.length - 1
                  ? "Finalizar práctica"
                  : "Siguiente pregunta →"}
              </button>

            </div>

          )}

        </div>

      </div>

    </main>
  );
}