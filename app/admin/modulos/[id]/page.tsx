"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Modulo = {
  id: string;
  titulo: string;
  descripcion: string | null;
  orden: number;
  activo: boolean;
  created_at?: string;
};

export default function ModuloAdminPage() {
  const params = useParams();
  const id = params.id as string;

  const [modulo, setModulo] = useState<Modulo | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [orden, setOrden] = useState("");
  const [activo, setActivo] = useState(true);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarModulo() {
      try {
        setCargando(true);
        setError("");

        const response = await fetch(`/api/modulos/${id}`);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "No se pudo cargar el módulo."
          );
        }

        setModulo(data);
        setTitulo(data.titulo || "");
        setDescripcion(data.descripcion || "");
        setOrden(String(data.orden ?? ""));
        setActivo(Boolean(data.activo));
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el módulo."
        );
      } finally {
        setCargando(false);
      }
    }

    if (id) {
      cargarModulo();
    }
  }, [id]);

  async function guardarCambios() {
    try {
      setGuardando(true);
      setMensaje("");
      setError("");

      const response = await fetch(`/api/modulos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo,
          descripcion,
          orden: Number(orden),
          activo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "No se pudo actualizar el módulo."
        );
      }

      setModulo(data);
      setTitulo(data.titulo || "");
      setDescripcion(data.descripcion || "");
      setOrden(String(data.orden ?? ""));
      setActivo(Boolean(data.activo));

      setMensaje("Módulo actualizado correctamente.");
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el módulo."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <main className="p-8">
        <div className="bg-white rounded-2xl shadow p-10 text-center">
          <div className="text-5xl mb-4">
            ⏳
          </div>

          <p className="text-gray-500">
            Cargando módulo...
          </p>
        </div>
      </main>
    );
  }

  if (error && !modulo) {
    return (
      <main className="p-8">
        <Link
          href="/admin/modulos"
          className="text-purple-600 font-semibold hover:underline"
        >
          ← Volver a módulos
        </Link>

        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-red-700">
            No se pudo cargar el módulo
          </h1>

          <p className="text-red-600 mt-2">
            {error}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8">
      <div className="mb-8">
        <Link
          href="/admin/modulos"
          className="text-purple-600 font-semibold hover:underline"
        >
          ← Volver a módulos
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10">
          <div>
            <div className="text-5xl mb-4">
              📚
            </div>

            <h1 className="text-4xl font-bold text-gray-800">
              Administrar módulo
            </h1>

            <p className="text-gray-500 mt-2">
              Modifica la información del módulo y administra su contenido.
            </p>
          </div>

          <span
            className={`inline-flex items-center px-4 py-2 rounded-full font-bold ${
              activo
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {activo ? "Activo" : "Inactivo"}
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Título del módulo
            </label>

            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Nombre del módulo"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Orden
            </label>

            <input
              type="number"
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
              min="1"
            />
          </div>
        </div>

        <div className="mt-8">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Descripción
          </label>

          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={5}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            placeholder="Descripción del módulo"
          />
        </div>

        <div className="mt-8">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="w-5 h-5"
            />

            <span className="font-bold text-gray-700">
              Módulo activo
            </span>
          </label>

          <p className="text-gray-500 text-sm mt-2 ml-8">
            Si está activo, el módulo podrá mostrarse en las áreas
            correspondientes de la plataforma.
          </p>
        </div>

        {mensaje && (
          <div className="mt-8 bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 font-semibold">
            ✅ {mensaje}
          </div>
        )}

        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 font-semibold">
            ⚠️ {error}
          </div>
        )}

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={guardarCambios}
            disabled={guardando}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {guardando
              ? "Guardando..."
              : "💾 Guardar cambios"}
          </button>

          <Link
            href="/admin/modulos"
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition text-center"
          >
            Cancelar
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-2xl font-bold text-gray-800">
            📦 Contenido del módulo
          </h2>

          <p className="text-gray-500 mt-2">
            Desde aquí administraremos los materiales que pertenecen a este
            módulo.
          </p>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
            <div className="border border-gray-200 rounded-2xl p-6">
              <div className="text-4xl mb-4">
                📄
              </div>

              <h3 className="text-xl font-bold text-gray-800">
                PDFs
              </h3>

              <p className="text-gray-500 mt-2">
                Material de estudio en PDF.
              </p>
            </div>

            <div className="border border-gray-200 rounded-2xl p-6">
              <div className="text-4xl mb-4">
                🎥
              </div>

              <h3 className="text-xl font-bold text-gray-800">
                Videos
              </h3>

              <p className="text-gray-500 mt-2">
                Videos relacionados con el módulo.
              </p>
            </div>

            <div className="border border-gray-200 rounded-2xl p-6">
              <div className="text-4xl mb-4">
                📝
              </div>

              <h3 className="text-xl font-bold text-gray-800">
                Preguntas
              </h3>

              <p className="text-gray-500 mt-2">
                Preguntas y prácticas.
              </p>
            </div>

            <div className="border border-gray-200 rounded-2xl p-6">
              <div className="text-4xl mb-4">
                📚
              </div>

              <h3 className="text-xl font-bold text-gray-800">
                Recursos
              </h3>

              <p className="text-gray-500 mt-2">
                Material complementario.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}