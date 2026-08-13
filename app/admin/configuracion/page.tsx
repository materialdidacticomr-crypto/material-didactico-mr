"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ConfiguracionPage() {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [permitirRegistros, setPermitirRegistros] = useState(true);
  const [modoMantenimiento, setModoMantenimiento] = useState(false);

  const [configuracionId, setConfiguracionId] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  async function cargarConfiguracion() {
    setCargando(true);

    const { data, error } = await supabase
      .from("configuracion")
      .select("*")
      .order("actualizado_en", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error cargando configuración:", error);
      alert(error.message);
      setCargando(false);
      return;
    }

    const configuracion = data?.[0];

    if (!configuracion) {
      alert("No se encontró ninguna configuración.");
      setCargando(false);
      return;
    }

    setConfiguracionId(configuracion.id);
    setNombre(configuracion.nombre_plataforma || "");
    setDescripcion(configuracion.descripcion || "");
    setPermitirRegistros(configuracion.permitir_registros ?? true);
    setModoMantenimiento(configuracion.modo_mantenimiento ?? false);

    setCargando(false);
  }

  async function guardarConfiguracion() {
    if (!configuracionId) {
      alert("No se encontró el registro de configuración.");
      return;
    }

    if (!nombre.trim()) {
      alert("El nombre de la plataforma es obligatorio.");
      return;
    }

    setGuardando(true);

    const { error } = await supabase
      .from("configuracion")
      .update({
        nombre_plataforma: nombre.trim(),
        descripcion: descripcion.trim(),
        permitir_registros: permitirRegistros,
        modo_mantenimiento: modoMantenimiento,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", configuracionId);

    setGuardando(false);

    if (error) {
      console.error("Error guardando configuración:", error);
      alert(error.message);
      return;
    }

    alert("Configuración guardada correctamente.");

    await cargarConfiguracion();
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-100 p-10">
        <div className="bg-white rounded-2xl shadow p-8">
          <p className="text-gray-600">
            Cargando configuración...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">
          Configuración
        </h1>

        <p className="text-gray-500 mt-2 text-lg">
          Configure los datos generales de Material Didáctico MR Academy.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-8 max-w-4xl">

        {/* NOMBRE */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">
            Nombre de la plataforma
          </label>

          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border rounded-lg w-full p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Nombre de la plataforma"
          />
        </div>

        {/* DESCRIPCIÓN */}
        <div className="mb-6">
          <label className="block font-semibold mb-2">
            Descripción
          </label>

          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            className="border rounded-lg w-full p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Descripción de la plataforma"
          />
        </div>

        {/* PERMITIR REGISTROS */}
        <div className="flex items-center justify-between border rounded-xl p-5 mb-4">
          <div>
            <h3 className="font-bold text-lg">
              Permitir registros
            </h3>

            <p className="text-gray-500 text-sm mt-1">
              Permite que nuevos usuarios puedan registrarse en la plataforma.
            </p>
          </div>

          <input
            type="checkbox"
            checked={permitirRegistros}
            onChange={(e) =>
              setPermitirRegistros(e.target.checked)
            }
            className="w-6 h-6 accent-red-600 cursor-pointer"
          />
        </div>

        {/* MODO MANTENIMIENTO */}
        <div className="flex items-center justify-between border rounded-xl p-5 mb-8">
          <div>
            <h3 className="font-bold text-lg">
              Modo mantenimiento
            </h3>

            <p className="text-gray-500 text-sm mt-1">
              Activa el modo mantenimiento de la plataforma.
            </p>
          </div>

          <input
            type="checkbox"
            checked={modoMantenimiento}
            onChange={(e) =>
              setModoMantenimiento(e.target.checked)
            }
            className="w-6 h-6 accent-red-600 cursor-pointer"
          />
        </div>

        {/* BOTÓN */}
        <button
          onClick={guardarConfiguracion}
          disabled={guardando}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-bold transition"
        >
          {guardando
            ? "Guardando..."
            : "Guardar configuración"}
        </button>

      </div>
    </main>
  );
}