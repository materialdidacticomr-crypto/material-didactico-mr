"use client";

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

        <div className="bg-white rounded-xl shadow-xl p-10">

          <h1 className="text-3xl font-bold mb-4">
            {modulo.titulo}
          </h1>

          <p>No hay preguntas disponibles.</p>

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

      setIndice(indice + 1);
      setRespuesta("");
      setMostrarResultado(false);

    } else {

      setIndice(preguntas.length);

    }

  }

  if (indice >= preguntas.length) {

    const porcentaje = Math.round(
      (correctas / preguntas.length) * 100
    );

    return (

      <main className="min-h-screen bg-gray-100 flex items-center justify-center">

        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-xl w-full">

          <h1 className="text-4xl font-bold text-red-600 mb-8">

            Práctica finalizada

          </h1>

          <p className="text-xl mb-4">

            Correctas: <b>{correctas}</b>

          </p>

          <p className="text-xl mb-4">

            Incorrectas: <b>{preguntas.length - correctas}</b>

          </p>

          <p className="text-3xl font-bold text-green-600 mb-8">

            {porcentaje}%

          </p>

          <a
            href="/campus"
            className="block bg-red-600 hover:bg-red-700 text-white text-center rounded-xl py-4 font-bold"
          >
            Volver al Campus
          </a>

        </div>

      </main>

    );

  }

  return (

    <main className="min-h-screen bg-gray-100">

      <div className="max-w-4xl mx-auto py-14 px-8">

        <h1 className="text-4xl font-bold text-red-600">

          {modulo.titulo}

        </h1>

        <p className="mt-3 text-gray-600">

          Pregunta {indice + 1} de {preguntas.length}

        </p>

        <div className="w-full bg-gray-300 rounded-full h-3 mt-6">

          <div
            className="bg-red-600 h-3 rounded-full"
            style={{
              width: `${((indice + 1) / preguntas.length) * 100}%`,
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
                "w-full border rounded-xl p-4 text-left hover:bg-gray-100";

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

                <p>

                  {pregunta.explicacion}

                </p>

              </div>

              <button
                onClick={siguiente}
                className="mt-8 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold"
              >
                {indice === preguntas.length - 1
                  ? "Finalizar"
                  : "Siguiente"}
              </button>

            </div>

          )}

        </div>

      </div>

    </main>

  );

}