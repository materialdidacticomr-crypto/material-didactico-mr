"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Modulo = {
  id: string;
  titulo: string;
  orden: number;
  activo: boolean;
};

export default function PreguntaForm() {
  const searchParams = useSearchParams();
  const moduloIdUrl = searchParams.get("modulo_id");

  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [moduloId, setModuloId] = useState("");

  const [pregunta, setPregunta] = useState("");
  const [opcionA, setOpcionA] = useState("");
  const [opcionB, setOpcionB] = useState("");
  const [opcionC, setOpcionC] = useState("");
  const [opcionD, setOpcionD] = useState("");

  const [respuesta, setRespuesta] = useState("A");
  const [explicacion, setExplicacion] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [cargandoModulos, setCargandoModulos] = useState(true);

  useEffect(() => {
    cargarModulos();
  }, []);

  useEffect(() => {
    if (moduloIdUrl && modulos.length > 0) {
      const moduloExiste = modulos.some(
        (modulo) => modulo.id === moduloIdUrl
      );

      if (moduloExiste) {
        setModuloId(moduloIdUrl);
      }
    }
  }, [moduloIdUrl, modulos]);

  async function cargarModulos() {
    try {
      setCargandoModulos(true);

      const { data, error } = await supabase
        .from("modulos")
        .select("id, titulo, orden, activo")
        .order("orden");

      if (error) {
        console.error("Error cargando módulos:", error);
        alert(error.message);
        return;
      }

      const lista = data || [];

      setModulos(lista);

      if (moduloIdUrl) {
        const moduloExiste = lista.some(
          (modulo) => modulo.id === moduloIdUrl
        );

        if (moduloExiste) {
          setModuloId(moduloIdUrl);
          return;
        }
      }

      if (lista.length > 0) {
        setModuloId(lista[0].id);
      }
    } finally {
      setCargandoModulos(false);
    }
  }

  async function guardarPregunta() {
    const preguntaLimpia = pregunta.trim();
    const opcionALimpia = opcionA.trim();
    const opcionBLimpia = opcionB.trim();
    const opcionCLimpia = opcionC.trim();
    const opcionDLimpia = opcionD.trim();
    const explicacionLimpia = explicacion.trim();

    if (
      !preguntaLimpia ||
      !opcionALimpia ||
      !opcionBLimpia ||
      !opcionCLimpia ||
      !opcionDLimpia ||
      !moduloId
    ) {
      alert("Complete todos los campos obligatorios.");
      return;
    }

    setGuardando(true);

    try {
      const { error } = await supabase
        .from("preguntas")
        .insert({
          modulo_id: moduloId,
          pregunta: preguntaLimpia,
          opcion_a: opcionALimpia,
          opcion_b: opcionBLimpia,
          opcion_c: opcionCLimpia,
          opcion_d: opcionDLimpia,
          respuesta_correcta: respuesta,
          explicacion: explicacionLimpia,
          activo: true,
        });

      if (error) {
        console.error("Error guardando pregunta:", error);
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
    } catch (error) {
      console.error(error);
      alert("Error inesperado al guardar la pregunta.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          📝 Nueva pregunta
        </h2>

        <p className="text-gray-500 mt-2">
          Crea una pregunta y asígnala al módulo correspondiente.
        </p>
      </div>

      <label className="block font-semibold mb-2">
        Módulo
      </label>

      <select
        value={moduloId}
        onChange={(e) => setModuloId(e.target.value)}
        disabled={cargandoModulos || guardando}
        className="border rounded-lg w-full p-3 mb-6 disabled:bg-gray-100"
      >
        <option value="">
          Seleccione un módulo
        </option>

        {modulos.map((modulo) => (
          <option
            key={modulo.id}
            value={modulo.id}
          >
            {modulo.orden}. {modulo.titulo}
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
        placeholder="Escriba la pregunta"
        disabled={guardando}
      />

      <label className="block font-semibold mb-2">
        Opción A
      </label>

      <input
        value={opcionA}
        onChange={(e) => setOpcionA(e.target.value)}
        className="border rounded-lg w-full p-3 mb-6"
        disabled={guardando}
      />

      <label className="block font-semibold mb-2">
        Opción B
      </label>

      <input
        value={opcionB}
        onChange={(e) => setOpcionB(e.target.value)}
        className="border rounded-lg w-full p-3 mb-6"
        disabled={guardando}
      />

      <label className="block font-semibold mb-2">
        Opción C
      </label>

      <input
        value={opcionC}
        onChange={(e) => setOpcionC(e.target.value)}
        className="border rounded-lg w-full p-3 mb-6"
        disabled={guardando}
      />

      <label className="block font-semibold mb-2">
        Opción D
      </label>

      <input
        value={opcionD}
        onChange={(e) => setOpcionD(e.target.value)}
        className="border rounded-lg w-full p-3 mb-6"
        disabled={guardando}
      />

      <label className="block font-semibold mb-2">
        Respuesta correcta
      </label>

      <select
        value={respuesta}
        onChange={(e) => setRespuesta(e.target.value)}
        disabled={guardando}
        className="border rounded-lg w-full p-3 mb-6 disabled:bg-gray-100"
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
        placeholder="Explicación de la respuesta"
        disabled={guardando}
      />

      <button
        type="button"
        onClick={guardarPregunta}
        disabled={guardando || cargandoModulos}
        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-bold transition"
      >
        {guardando ? "Guardando..." : "Guardar Pregunta"}
      </button>
    </div>
  );
}