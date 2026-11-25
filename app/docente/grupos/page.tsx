
"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, UsuarioActual } from "@/lib/auth";

interface Grupo {
  id: string;
  nombre: string;
  nivel: string | null;
  seccion: string | null;
  curso_lectivo: number;
  descripcion: string | null;
  created_at: string;
}

export default function GruposPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [nombre, setNombre] = useState("");
  const [nivel, setNivel] = useState("");
  const [seccion, setSeccion] = useState("");
  const [curso, setCurso] = useState("2027");
  const [descripcion, setDescripcion] = useState("");

  async function cargarGrupos(docenteId: string) {
    const { data, error } = await supabase
      .from("grupos")
      .select("id, nombre, nivel, seccion, curso_lectivo, descripcion, created_at")
      .eq("docente_id", docenteId)
      .order("created_at", { ascending: false });

    if (error) {
      setError("No fue posible cargar los grupos: " + error.message);
      return;
    }

    setGrupos((data || []) as Grupo[]);
  }

  useEffect(() => {
    let activo = true;

    async function iniciar() {
      const usuarioActual = await getCurrentUser();

      if (!activo) return;

      if (!usuarioActual || !usuarioActual.activo) {
        router.replace("/login");
        return;
      }

      if (usuarioActual.rol !== "docente") {
        router.replace("/dashboard");
        return;
      }

      setUsuario(usuarioActual);

      const { data, error } = await supabase
        .from("grupos")
        .select("id, nombre, nivel, seccion, curso_lectivo, descripcion, created_at")
        .eq("docente_id", usuarioActual.id)
        .order("created_at", { ascending: false });

      if (!activo) return;

      if (error) {
        setError("Error al cargar los grupos: " + error.message);
      } else {
        setGrupos((data || []) as Grupo[]);
      }

      setCargando(false);
    }

    iniciar();

    return () => {
      activo = false;
    };
  }, [router]);

  async function registrarGrupo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!usuario) return;

    setError("");
    setMensaje("");

    if (!nombre.trim()) {
      setError("Escribí el nombre del grupo.");
      return;
    }

    setGuardando(true);

    const { error } = await supabase.from("grupos").insert({
      docente_id: usuario.id,
      nombre: nombre.trim(),
      nivel: nivel || null,
      seccion: seccion.trim() || null,
      curso_lectivo: Number(curso),
      descripcion: descripcion.trim() || null,
    });

    setGuardando(false);

    if (error) {
      setError("No se pudo registrar el grupo: " + error.message);
      return;
    }

    setNombre("");
    setNivel("");
    setSeccion("");
    setCurso("2027");
    setDescripcion("");

    setMensaje("¡Grupo registrado correctamente!");
    await cargarGrupos(usuario.id);
  }

  async function eliminarGrupo(id: string) {
    if (!usuario) return;

    const confirmar = window.confirm(
      "¿Deseás eliminar este grupo? Esta acción no se puede deshacer."
    );

    if (!confirmar) return;

    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("grupos")
      .delete()
      .eq("id", id)
      .eq("docente_id", usuario.id);

    if (error) {
      setError("No se pudo eliminar el grupo: " + error.message);
      return;
    }

    setMensaje("Grupo eliminado correctamente.");
    await cargarGrupos(usuario.id);
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f4fc]">
        <p className="text-lg font-semibold text-slate-600">
          Cargando tus grupos...
        </p>
      </main>
    );
  }

  if (!usuario) return null;

  return (
    <main className="min-h-screen bg-[#f5f4fc] p-4 text-[#17213f] sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-purple-700 hover:underline"
            >
              ← Volver al panel principal
            </Link>
            <h1 className="mt-3 text-3xl font-extrabold">
              Mis grupos
            </h1>
            <p className="mt-2 text-slate-600">
              Organizá tus grupos y cursos lectivos.
            </p>
          </div>

          <div className="rounded-2xl bg-white px-5 py-3 shadow-sm">
            <p className="text-xs text-slate-500">Docente</p>
            <p className="font-bold">{usuario.nombre}</p>
          </div>
        </header>

        {mensaje && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-6">
              <span className="text-3xl">➕</span>
              <h2 className="mt-2 text-xl font-extrabold">
                Registrar nuevo grupo
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Completá los datos para agregar un grupo a tu espacio docente.
              </p>
            </div>

            <form onSubmit={registrarGrupo} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Nombre del grupo *
                </label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ejemplo: Primero A"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Nivel educativo
                </label>
                <select
                  value={nivel}
                  onChange={(e) => setNivel(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-purple-500"
                >
                  <option value="">Seleccionar nivel</option>
                  <option value="Materno">Materno</option>
                  <option value="Interactivo">Interactivo</option>
                  <option value="Transición">Transición</option>
                  <option value="Primero">Primero</option>
                  <option value="Segundo">Segundo</option>
                  <option value="Tercero">Tercero</option>
                  <option value="Cuarto">Cuarto</option>
                  <option value="Quinto">Quinto</option>
                  <option value="Sexto">Sexto</option>
                  <option value="Sétimo">Sétimo</option>
                  <option value="Octavo">Octavo</option>
                  <option value="Noveno">Noveno</option>
                  <option value="Décimo">Décimo</option>
                  <option value="Undécimo">Undécimo</option>
                  <option value="Duodécimo">Duodécimo</option>
                  <option value="Aula Integrada">Aula Integrada</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Sección
                </label>
                <input
                  value={seccion}
                  onChange={(e) => setSeccion(e.target.value)}
                  placeholder="Ejemplo: 1-A"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Curso lectivo
                </label>
                <select
                  value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-purple-500"
                >
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                  <option value="2028">2028</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Descripción (opcional)
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  placeholder="Información adicional del grupo..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={guardando}
                className="w-full rounded-xl bg-purple-700 px-5 py-3 font-bold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando ? "Guardando..." : "Guardar grupo"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold">
                  Grupos registrados
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tus grupos organizados por curso lectivo.
                </p>
              </div>
              <div className="rounded-2xl bg-purple-100 px-4 py-3 text-center">
                <p className="text-2xl font-extrabold text-purple-800">
                  {grupos.length}
                </p>
                <p className="text-xs font-semibold text-purple-700">
                  Grupos
                </p>
              </div>
            </div>

            {grupos.length === 0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                <span className="text-6xl">🏫</span>
                <h3 className="mt-4 font-bold">
                  Todavía no tenés grupos registrados
                </h3>
                <p className="mt-2 max-w-xs text-sm text-slate-500">
                  Utilizá el formulario para crear tu primer grupo.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {grupos.map((grupo) => (
                  <article
                    key={grupo.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-extrabold">
                          {grupo.nombre}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {grupo.nivel || "Nivel no indicado"}
                          {grupo.seccion ? ` · Sección ${grupo.seccion}` : ""}
                        </p>
                        <span className="mt-3 inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800">
                          Curso lectivo {grupo.curso_lectivo}
                        </span>
                        {grupo.descripcion && (
                          <p className="mt-3 text-sm text-slate-600">
                            {grupo.descripcion}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => eliminarGrupo(grupo.id)}
                        aria-label={`Eliminar ${grupo.nombre}`}
                        className="shrink-0 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
