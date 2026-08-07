"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PreguntaForm() {

  const [modulos, setModulos] = useState<any[]>([]);
  const [moduloId, setModuloId] = useState("");

  const [pregunta, setPregunta] = useState("");
  const [opcionA, setOpcionA] = useState("");
  const [opcionB, setOpcionB] = useState("");
  const [opcionC, setOpcionC] = useState("");
  const [opcionD, setOpcionD] = useState("");

  const [respuesta, setRespuesta] = useState("A");
  const [explicacion, setExplicacion] = useState("");

  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarModulos();
  }, []);

  async function cargarModulos() {

    const { data, error } = await supabase
      .from("modulos")
      .select("*")
      .order("orden");

    if (error) {
      alert(error.message);
      return;
    }

    setModulos(data || []);

    if (data && data.length > 0) {
      setModuloId(data[0].id);
    }

  }

  async function guardarPregunta() {

    if (
      !pregunta ||
      !opcionA ||
      !opcionB ||
      !opcionC ||
      !opcionD ||
      !moduloId
    ) {
      alert("Complete todos los campos.");
      return;
    }

    setGuardando(true);

    const { error } = await supabase
      .from("preguntas")
      .insert({
        modulo_id: moduloId,
        pregunta,
        opcion_a: opcionA,
        opcion_b: opcionB,
        opcion_c: opcionC,
        opcion_d: opcionD,
        respuesta_correcta: respuesta,
        explicacion,
        activo: true,
      });

    setGuardando(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Pregunta guardada correctamente.");

    setPregunta("");
    setOpcionA("");
    setOpcionB("");
    setOpcionC("");
    setOpcionD("");
    setExplicacion("");
    setRespuesta("A");

    window.location.reload();

  }

  return (

    <div className="bg-white rounded-xl shadow p-8">

      <h2 className="text-2xl font-bold mb-8">
        Nueva Pregunta
      </h2>

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

      <label className="block font-semibold mb-2">
        Pregunta
      </label>

      <textarea
        value={pregunta}
        onChange={(e) => setPregunta(e.target.value)}
        className="border rounded-lg w-full p-3 mb-6"
        rows={4}
      />

      <label className="block font-semibold mb-2">
        Opción A
      </label>

      <input
        value={opcionA}
        onChange={(e) => setOpcionA(e.target.value)}
        className="border rounded-lg w-full p-3 mb-6"
      />

      <label className="block font-semibold mb-2">
        Opción B
      </label>

      <input
        value={opcionB}
        onChange={(e) => setOpcionB(e.target.value)}
        className="border rounded-lg w-full p-3 mb-6"
      />

      <label className="block font-semibold mb-2">
        Opción C
      </label>

      <input
        value={opcionC}
        onChange={(e) => setOpcionC(e.target.value)}
        className="border rounded-lg w-full p-3 mb-6"
      />

      <label className="block font-semibold mb-2">
        Opción D
      </label>

      <input
        value={opcionD}
        onChange={(e) => setOpcionD(e.target.value)}
        className="border rounded-lg w-full p-3 mb-6"
      />

      <label className="block font-semibold mb-2">
        Respuesta Correcta
      </label>

      <select
        value={respuesta}
        onChange={(e) => setRespuesta(e.target.value)}
        className="border rounded-lg w-full p-3 mb-6"
      >
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="C">C</option>
        <option value="D">D</option>
      </select>

      <label className="block font-semibold mb-2">
        Explicación
      </label>

      <textarea
        value={explicacion}
        onChange={(e) => setExplicacion(e.target.value)}
        className="border rounded-lg w-full p-3 mb-6"
        rows={4}
      />

      <button
        onClick={guardarPregunta}
        disabled={guardando}
        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-bold"
      >
        {guardando ? "Guardando..." : "Guardar Pregunta"}
      </button>

    </div>

  );

}