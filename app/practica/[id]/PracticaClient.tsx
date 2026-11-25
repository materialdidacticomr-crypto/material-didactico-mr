
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

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

  const [guardandoResultado, setGuardandoResultado] = useState(false);
  const [resultadoGuardado, setResultadoGuardado] = useState(false);
  const [errorGuardando, setErrorGuardando] = useState("");

  const resultadoGuardadoRef = useRef(false);

  useEffect(() => {
    async function guardarResultado() {
      if (
        indice < preguntas.length ||
        preguntas.length === 0 ||
        resultadoGuardadoRef.current
      ) {
        return;
      }

      resultadoGuardadoRef.current = true;
      setGuardandoResultado(true);
      setErrorGuardando("");

      const porcentaje = Math.round(
        (correctas / preguntas.length) * 100
      );

      try {
        const {
          data: { user },
          error: errorUsuario,
        } = await supabase.auth.getUser();

        if (errorUsuario) throw errorUsuario;

        if (!user) {
          throw new Error("No se encontró una sesión activa.");
        }

        const { error } = await supabase
          .from("intentos_examen")
          .insert({
            usuario_id: user.id,
            modulo_id: modulo.id,
            total_preguntas: preguntas.length,
            respuestas_correctas: correctas,
            porcentaje,
          });

        if (error) throw error;

        setResultadoGuardado(true);
      } catch (error: any) {
        console.error("Error al guardar el resultado:", error);
        setErrorGuardando(
          error?.message ||
          "No se pudo guardar el resultado de la práctica."
        );
      } finally {
        setGuardandoResultado(false);
      }
    }

    guardarResultado();
  }, [indice, preguntas.length, correctas, modulo.id]);

  if (preguntas.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#fff8fc] via-white to-[#f3eaff] flex items-center justify-center px-5">
        <div className="bg-white border border-pink-100 rounded-3xl shadow-xl p-10 max-w-xl w-full text-center">
          <div className="text-5xl mb-5">📚</div>
          <h1 className="text-2xl font-black text-[#38264f] mb-4">
            {modulo.titulo}
          </h1>
          <p className="text-gray-500">
            No hay preguntas disponibles para este módulo.
          </p>
          <Link
            href={`/campus/${modulo.id}`}
            className="inline-block mt-7 bg-gradient-to-r from-[#b45bc4] to-[#df579e] text-white px-7 py-3 rounded-xl font-bold"
          >
            Volver al módulo
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

    resultadoGuardadoRef.current = false;
    setResultadoGuardado(false);
    setErrorGuardando("");
  }

  if (indice >= preguntas.length) {
    const incorrectas = preguntas.length - correctas;
    const porcentaje = Math.round(
      (correctas / preguntas.length) * 100
    );

    return (
      <main className="min-h-screen bg-gradient-to-br from-[#fff7fb] via-white to-[#f0e9ff] px-5 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-pink-100 rounded-[30px] shadow-[0_20px_60px_rgba(150,90,160,0.12)] p-7 md:p-10 text-center">

            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-5xl mb-6">
              🎉
            </div>

            <p className="text-xs font-bold tracking-[0.25em] text-[#bd65a8] uppercase mb-3">
              Campus MR · Resultado
            </p>

            <h1 className="text-3xl md:text-4xl font-black text-[#38264f] mb-3">
              ¡Práctica finalizada!
            </h1>

            <p className="text-gray-500 mb-8">
              {modulo.titulo}
            </p>

            <div className="rounded-3xl bg-gradient-to-br from-[#fff2f8] to-[#f1eaff] p-7 mb-7">
              <p className="text-sm font-semibold text-[#80658e] mb-2">
                TU RESULTADO
              </p>

              <p className="text-5xl font-black text-[#ad55b7]">
                {porcentaje}%
              </p>

              <p className="text-gray-500 mt-2">
                {correctas} de {preguntas.length} respuestas correctas
              </p>

              <div className="w-full h-3 rounded-full bg-white mt-6 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#b45bc4] to-[#df579e]"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#effaf5] border border-green-100 rounded-2xl p-5">
                <div className="text-3xl mb-2">✓</div>
                <p className="text-3xl font-black text-green-600">
                  {correctas}
                </p>
                <p className="text-sm text-green-700 font-semibold">
                  Correctas
                </p>
              </div>

              <div className="bg-[#fff1f2] border border-red-100 rounded-2xl p-5">
                <div className="text-3xl mb-2">✕</div>
                <p className="text-3xl font-black text-red-500">
                  {incorrectas}
                </p>
                <p className="text-sm text-red-600 font-semibold">
                  Incorrectas
                </p>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 mb-7">
              <p className="text-xs tracking-widest font-bold text-purple-500">
                CALIFICACIÓN
              </p>
              <p className="text-3xl font-black text-[#7850a5] mt-2">
                {porcentaje} / 100
              </p>
            </div>

            {guardandoResultado && (
              <div className="mb-5 bg-blue-50 text-blue-700 rounded-xl p-4">
                Guardando resultado...
              </div>
            )}

            {resultadoGuardado && (
              <div className="mb-5 bg-green-50 border border-green-100 text-green-700 rounded-xl p-4">
                ✓ Resultado guardado correctamente.
              </div>
            )}

            {errorGuardando && (
              <div className="mb-5 bg-red-50 border border-red-100 text-red-700 rounded-xl p-4">
                <p className="font-bold">No se pudo guardar el resultado.</p>
                <p className="text-sm mt-2 break-words">
                  {errorGuardando}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={reiniciar}
                className="w-full bg-gradient-to-r from-[#b45bc4] to-[#df579e] hover:opacity-90 text-white py-4 rounded-xl font-bold shadow-lg shadow-pink-200 transition"
              >
                ↻ Intentar nuevamente
              </button>

              <Link
                href={`/campus/${modulo.id}`}
                className="block w-full bg-white border border-purple-200 text-[#79518e] hover:bg-purple-50 py-4 rounded-xl font-bold transition"
              >
                Volver al módulo
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-[#a18aa9] mt-7">
            Material Didáctico MR · Aprendemos juntos
          </p>
        </div>
      </main>
    );
  }

  const progreso = ((indice + 1) / preguntas.length) * 100;

  const opciones = [
    pregunta.opcion_a,
    pregunta.opcion_b,
    pregunta.opcion_c,
    pregunta.opcion_d,
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#fff8fc] via-white to-[#f2eaff] px-4 py-8 md:py-12">

      <div className="max-w-4xl mx-auto">

        <div className="flex flex-wrap justify-between items-center gap-3 mb-7">
          <Link
            href={`/campus/${modulo.id}`}
            className="inline-flex items-center gap-2 bg-white border border-pink-100 text-[#a653a5] hover:bg-pink-50 rounded-full px-5 py-2.5 text-sm font-bold shadow-sm transition"
          >
            ← Volver al módulo
          </Link>

          <span className="text-xs font-bold tracking-wider text-[#b15da7] bg-pink-100 rounded-full px-4 py-2">
            CAMPUS MR · PRÁCTICA
          </span>
        </div>

        <section className="bg-white border border-pink-100 rounded-[28px] shadow-[0_15px_45px_rgba(150,90,160,0.10)] p-6 md:p-9 mb-7">

          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#bd65a8] mb-3">
                Preparación para la Idoneidad Docente
              </p>

              <h1 className="text-2xl md:text-3xl font-black text-[#38264f] leading-tight">
                {modulo.titulo}
              </h1>

              <p className="text-sm text-gray-500 mt-3">
                Poné a prueba tus conocimientos y avanzá a tu ritmo.
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl w-14 h-14 flex items-center justify-center text-2xl">
              📝
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-bold text-[#59446e]">
                Pregunta {indice + 1} de {preguntas.length}
              </p>

              <p className="text-sm font-bold text-[#b35eaa]">
                {Math.round(progreso)}% completado
              </p>
            </div>

            <div className="h-3 w-full rounded-full bg-[#f0eaf4] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#b45bc4] to-[#df579e] transition-all duration-500"
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            <span className="bg-pink-50 text-[#b65d9f] rounded-full px-3 py-1.5 text-xs font-semibold">
              ✓ Aprendizaje
            </span>
            <span className="bg-purple-50 text-[#8663ad] rounded-full px-3 py-1.5 text-xs font-semibold">
              ✓ Evaluación
            </span>
            <span className="bg-green-50 text-green-700 rounded-full px-3 py-1.5 text-xs font-semibold">
              ✓ Seguimiento
            </span>
          </div>
        </section>

        <section className="bg-white border border-pink-100 rounded-[28px] shadow-[0_15px_45px_rgba(150,90,160,0.10)] overflow-hidden">

          <div className="bg-gradient-to-r from-[#fce8f3] to-[#f0eaff] px-6 md:px-9 py-5 border-b border-pink-100">
            <p className="text-xs font-bold tracking-[0.2em] text-[#b45ca6] uppercase">
              Evaluación de conocimientos
            </p>

            <h2 className="text-lg font-bold text-[#49345f] mt-1">
              Lee cuidadosamente y seleccioná una respuesta.
            </h2>
          </div>

          <div className="p-6 md:p-9">

            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-pink-100 text-[#b45ca6] font-black">
                {String(indice + 1).padStart(2, "0")}
              </span>

              <span className="text-xs font-bold text-[#a18aa9] uppercase tracking-wider">
                Pregunta de selección única
              </span>
            </div>

            <h3 className="text-lg md:text-xl font-bold text-[#38264f] leading-relaxed mb-8">
              {pregunta.pregunta}
            </h3>

            <div className="space-y-3">
              {opciones.map((opcion, index) => {
                const letra = ["A", "B", "C", "D"][index];
                const seleccionada = respuesta === letra;
                const esCorrecta = letra === pregunta.respuesta_correcta;

                let clase =
                  "w-full flex items-start gap-4 text-left border-2 border-[#eee7f3] bg-white hover:border-[#d7a5d8] hover:bg-[#fff8fc] rounded-2xl p-4 md:p-5 transition duration-200";

                if (mostrarResultado && esCorrecta) {
                  clase =
                    "w-full flex items-start gap-4 text-left border-2 border-green-300 bg-green-50 rounded-2xl p-4 md:p-5";
                } else if (mostrarResultado && seleccionada) {
                  clase =
                    "w-full flex items-start gap-4 text-left border-2 border-red-300 bg-red-50 rounded-2xl p-4 md:p-5";
                } else if (mostrarResultado) {
                  clase =
                    "w-full flex items-start gap-4 text-left border-2 border-gray-100 bg-gray-50 rounded-2xl p-4 md:p-5 opacity-70";
                }

                return (
                  <button
                    key={letra}
                    type="button"
                    disabled={mostrarResultado}
                    className={clase}
                    onClick={() => responder(letra)}
                  >
                    <span className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                      mostrarResultado && esCorrecta
                        ? "bg-green-200 text-green-800"
                        : mostrarResultado && seleccionada
                        ? "bg-red-200 text-red-800"
                        : "bg-[#f5eafa] text-[#9661a8]"
                    }`}>
                      {letra}
                    </span>

                    <span className="flex-1 text-sm md:text-base text-[#514361] font-medium leading-relaxed pt-1">
                      {opcion}
                    </span>

                    {mostrarResultado && esCorrecta && (
                      <span className="text-green-600 font-black text-lg">✓</span>
                    )}

                    {mostrarResultado && seleccionada && !esCorrecta && (
                      <span className="text-red-500 font-black text-lg">✕</span>
                    )}
                  </button>
                );
              })}
            </div>

            {mostrarResultado && (
              <div className="mt-8">
                <div className={`rounded-2xl border p-6 ${
                  respuesta === pregunta.respuesta_correcta
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}>
                  <h3 className={`text-lg font-black mb-3 ${
                    respuesta === pregunta.respuesta_correcta
                      ? "text-green-700"
                      : "text-red-700"
                  }`}>
                    {respuesta === pregunta.respuesta_correcta
                      ? "✓ ¡Muy bien! Respuesta correcta"
                      : "✕ Respuesta incorrecta"}
                  </h3>

                  <p className="text-sm text-gray-700 mb-3">
                    <strong>Respuesta correcta:</strong>{" "}
                    {pregunta.respuesta_correcta}
                  </p>

                  {pregunta.explicacion && (
                    <div className="bg-white/70 rounded-xl p-4">
                      <p className="text-xs font-bold tracking-wider text-[#8b6b9b] uppercase mb-2">
                        Explicación
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {pregunta.explicacion}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={siguiente}
                  className="mt-6 w-full bg-gradient-to-r from-[#b45bc4] to-[#df579e] hover:opacity-90 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-pink-200 transition"
                >
                  {indice === preguntas.length - 1
                    ? "Finalizar práctica →"
                    : "Siguiente pregunta →"}
                </button>
              </div>
            )}

            {!mostrarResultado && (
              <p className="text-center text-xs text-[#a18aa9] mt-7">
                Seleccioná una opción para comprobar tu respuesta.
              </p>
            )}

          </div>
        </section>

        <p className="text-center text-xs text-[#a18aa9] mt-8">
          Material Didáctico MR · Aprendemos juntos
        </p>

      </div>
    </main>
  );
}
