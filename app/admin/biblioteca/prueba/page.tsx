
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface Resultado {
  success?: boolean;
  message?: string;
  totalArchivos?: number;
  archivos?: {
    id?: string | null;
    nombre?: string | null;
    tipo?: string | null;
  }[];
  error?: string;
}

export default function PruebaGoogleDrivePage() {
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  async function probarConexion() {
    setCargando(true);
    setResultado(null);

    try {
      const {
        data: { session },
        error: errorSesion,
      } = await supabase.auth.getSession();

      if (errorSesion || !session?.access_token) {
        throw new Error(
          "No se pudo recuperar tu sesión. Inicia sesión nuevamente."
        );
      }

      const respuesta = await fetch(
        "/api/admin/biblioteca/drive-test",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        }
      );

      const datos: Resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || "No se pudo comprobar Google Drive."
        );
      }

      setResultado(datos);
    } catch (error) {
      setResultado({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado.",
      });
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F5FC] p-6 text-[#49375E] sm:p-10">
      <div className="mx-auto max-w-3xl">
        <a
          href="/admin/biblioteca"
          className="text-sm font-bold text-purple-700 hover:underline"
        >
          ← Volver a Biblioteca MR
        </a>

        <section className="mt-6 rounded-3xl bg-gradient-to-r from-[#34243F] to-[#754B7C] p-8 text-white shadow-xl">
          <p className="text-xs font-bold uppercase tracking-widest text-pink-200">
            Material Didáctico MR
          </p>

          <h1 className="mt-3 text-3xl font-black">
            Prueba de Google Drive
          </h1>

          <p className="mt-3 text-sm text-purple-100">
            Comprueba la conexión privada entre CAMPUS MR y la carpeta
            de materiales educativos.
          </p>
        </section>

        <section className="mt-6 rounded-3xl border border-purple-100 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-extrabold">
            Conexión de Biblioteca MR
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Esta prueba consulta los archivos de la carpeta compartida.
            No modifica ni elimina materiales.
          </p>

          <button
            type="button"
            onClick={probarConexion}
            disabled={cargando}
            className="mt-6 rounded-xl bg-purple-700 px-6 py-3 font-bold text-white shadow-md transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando
              ? "Comprobando conexión..."
              : "Probar conexión con Google Drive"}
          </button>

          {resultado && (
            <div
              className={`mt-6 rounded-2xl border p-5 ${
                resultado.success
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <h3 className="font-extrabold">
                {resultado.success
                  ? "Conexión establecida"
                  : "No se pudo completar la prueba"}
              </h3>

              <p className="mt-2 text-sm">
                {resultado.success
                  ? resultado.message
                  : resultado.error}
              </p>

              {resultado.success && (
                <>
                  <p className="mt-4 font-bold">
                    Archivos encontrados: {resultado.totalArchivos ?? 0}
                  </p>

                  <ul className="mt-3 space-y-2">
                    {resultado.archivos?.map((archivo) => (
                      <li
                        key={archivo.id}
                        className="rounded-lg border border-green-100 bg-white p-3 text-sm"
                      >
                        <p className="font-bold">{archivo.nombre}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {archivo.tipo}
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
