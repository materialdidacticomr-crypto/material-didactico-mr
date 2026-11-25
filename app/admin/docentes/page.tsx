
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function GestionDocentesPage() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function registrarDocente(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMensaje("");
    setError("");

    if (!nombre.trim() || !correo.trim()) {
      setError("Completá el nombre y el correo del docente.");
      return;
    }

    setGuardando(true);

    try {
      const {
        data: { session },
        error: errorSesion,
      } = await supabase.auth.getSession();

      if (errorSesion || !session?.access_token) {
        setError("Tu sesión no está disponible. Iniciá sesión nuevamente.");
        return;
      }

      const respuesta = await fetch("/api/admin/docentes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          correo: correo.trim().toLowerCase(),
        }),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setError(resultado.error || "No se pudo registrar al docente.");
        return;
      }

      setMensaje(
        resultado.message || "Docente registrado correctamente."
      );

      setNombre("");
      setCorreo("");
    } catch {
      setError("No fue posible comunicarse con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">

        <header className="rounded-3xl bg-gradient-to-r from-indigo-950 to-blue-800 p-7 text-white shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-200">
            CAMPUS MR 2.0 · Administración
          </p>

          <h1 className="mt-2 text-3xl font-black md:text-4xl">
            Gestión de docentes
          </h1>

          <p className="mt-3 max-w-2xl text-blue-100">
            Registrá nuevos docentes y enviá una invitación para que puedan
            establecer su contraseña e ingresar a la plataforma.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">

          <div className="mb-6">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100 text-3xl">
              👩‍🏫
            </div>

            <h2 className="text-2xl font-bold text-slate-800">
              Registrar nuevo docente
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              El docente recibirá un correo electrónico para establecer su
              contraseña.
            </p>
          </div>

          {mensaje && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
              <strong>¡Registro exitoso!</strong>
              <p className="mt-1">{mensaje}</p>
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <strong>No se pudo completar el registro.</strong>
              <p className="mt-1">{error}</p>
            </div>
          )}

          <form onSubmit={registrarDocente} className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Nombre completo del docente
              </label>

              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. María Rodríguez"
                maxLength={150}
                required
                className="w-full rounded-xl border border-slate-300 p-4 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Correo electrónico
              </label>

              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="docente@correo.com"
                maxLength={254}
                required
                className="w-full rounded-xl border border-slate-300 p-4 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
              <p className="font-bold">Información de acceso</p>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>El rol se asignará automáticamente como docente.</li>
                <li>El administrador autoriza la creación de la cuenta.</li>
                <li>El docente establecerá su propia contraseña mediante la invitación.</li>
                <li>Su perfil podrá seleccionar uno de los cuatro avatares disponibles.</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full rounded-xl bg-indigo-700 px-6 py-4 font-bold text-white shadow transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
            >
              {guardando ? "Registrando docente..." : "Registrar y enviar invitación"}
            </button>

          </form>
        </section>

        <div>
          <a
            href="/admin"
            className="inline-flex items-center gap-2 font-semibold text-indigo-700 hover:text-indigo-900"
          >
            ← Volver al panel de administración
          </a>
        </div>

      </div>
    </main>
  );
}
