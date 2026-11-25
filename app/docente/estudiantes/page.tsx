
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
}

interface Estudiante {
  id: string;
  grupo_id: string;
  nombre_completo: string;
  identificacion: string | null;
  fecha_nacimiento: string | null;
  observaciones: string | null;
}

const formularioInicial = {
  nombre_completo: "",
  identificacion: "",
  fecha_nacimiento: "",
  grupo_id: "",
  observaciones: "",
};

export default function EstudiantesPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

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

      const [resultadoGrupos, resultadoEstudiantes] = await Promise.all([
        supabase
          .from("grupos")
          .select("id, nombre, nivel, seccion, curso_lectivo")
          .eq("docente_id", usuarioActual.id)
          .order("nombre"),

        supabase
          .from("estudiantes")
          .select(
            "id, grupo_id, nombre_completo, identificacion, fecha_nacimiento, observaciones"
          )
          .eq("docente_id", usuarioActual.id)
          .order("nombre_completo"),
      ]);

      if (!activo) return;

      if (resultadoGrupos.error) {
        setError("Error al cargar los grupos: " + resultadoGrupos.error.message);
      } else {
        setGrupos((resultadoGrupos.data || []) as Grupo[]);
      }

      if (resultadoEstudiantes.error) {
        setError(
          "Error al cargar los estudiantes: " +
            resultadoEstudiantes.error.message
        );
      } else {
        setEstudiantes((resultadoEstudiantes.data || []) as Estudiante[]);
      }

      setCargando(false);
    }

    iniciar();

    return () => {
      activo = false;
    };
  }, [router]);

  function actualizarCampo(
    campo: keyof typeof formularioInicial,
    valor: string
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  function limpiarFormulario() {
    setFormulario(formularioInicial);
    setEditandoId(null);
  }

  async function guardarEstudiante(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!usuario) return;

    setMensaje("");
    setError("");

    if (!formulario.nombre_completo.trim()) {
      setError("Ingresá el nombre completo del estudiante.");
      return;
    }

    if (!formulario.grupo_id) {
      setError("Seleccioná el grupo al que pertenece el estudiante.");
      return;
    }

    setGuardando(true);

    const datos = {
      nombre_completo: formulario.nombre_completo.trim(),
      identificacion: formulario.identificacion.trim() || null,
      fecha_nacimiento: formulario.fecha_nacimiento || null,
      grupo_id: formulario.grupo_id,
      observaciones: formulario.observaciones.trim() || null,
    };

    const resultado = editandoId
      ? await supabase
          .from("estudiantes")
          .update(datos)
          .eq("id", editandoId)
          .eq("docente_id", usuario.id)
      : await supabase.from("estudiantes").insert({
          ...datos,
          docente_id: usuario.id,
        });

    setGuardando(false);

    if (resultado.error) {
      setError("No se pudo guardar el estudiante: " + resultado.error.message);
      return;
    }

    setMensaje(
      editandoId
        ? "Estudiante actualizado correctamente."
        : "Estudiante registrado correctamente."
    );

    limpiarFormulario();
    await cargarEstudiantes(usuario.id);
  }

  async function cargarEstudiantes(docenteId: string) {
    const { data, error } = await supabase
      .from("estudiantes")
      .select(
        "id, grupo_id, nombre_completo, identificacion, fecha_nacimiento, observaciones"
      )
      .eq("docente_id", docenteId)
      .order("nombre_completo");

    if (error) {
      setError("No se pudo actualizar la lista: " + error.message);
      return;
    }

    setEstudiantes((data || []) as Estudiante[]);
  }

  function prepararEdicion(estudiante: Estudiante) {
    setEditandoId(estudiante.id);
    setFormulario({
      nombre_completo: estudiante.nombre_completo,
      identificacion: estudiante.identificacion || "",
      fecha_nacimiento: estudiante.fecha_nacimiento || "",
      grupo_id: estudiante.grupo_id,
      observaciones: estudiante.observaciones || "",
    });
    setMensaje("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function eliminarEstudiante(id: string) {
    if (!usuario) return;

    const confirmar = window.confirm(
      "¿Deseás eliminar este estudiante? Esta acción no se puede deshacer."
    );

    if (!confirmar) return;

    setMensaje("");
    setError("");

    const { error } = await supabase
      .from("estudiantes")
      .delete()
      .eq("id", id)
      .eq("docente_id", usuario.id);

    if (error) {
      setError("No se pudo eliminar el estudiante: " + error.message);
      return;
    }

    setMensaje("Estudiante eliminado correctamente.");
    await cargarEstudiantes(usuario.id);
  }

  const estudiantesFiltrados = estudiantes.filter((estudiante) => {
    const termino = busqueda.toLowerCase().trim();
    const grupo = grupos.find((g) => g.id === estudiante.grupo_id);
    const nombreGrupo = grupo?.nombre || "";

    return (
      estudiante.nombre_completo.toLowerCase().includes(termino) ||
      (estudiante.identificacion || "").toLowerCase().includes(termino) ||
      nombreGrupo.toLowerCase().includes(termino)
    );
  });

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f4fc]">
        <p className="text-lg font-semibold text-slate-600">
          Cargando estudiantes...
        </p>
      </main>
    );
  }

  if (!usuario) return null;

  return (
    <main className="min-h-screen bg-[#f5f4fc] p-4 text-[#17213f] sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-purple-700 hover:underline"
          >
            ← Volver al panel principal
          </Link>

          <h1 className="mt-3 text-3xl font-extrabold">
            Registro de estudiantes
          </h1>

          <p className="mt-2 text-slate-600">
            Administrá los estudiantes de tus grupos.
          </p>
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

        {grupos.length === 0 && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-bold text-amber-900">
              Primero necesitás registrar un grupo.
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Los estudiantes deben estar asociados a un grupo.
            </p>
            <Link
              href="/docente/grupos"
              className="mt-3 inline-block rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white"
            >
              Ir a Mis grupos →
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-6">
              <span className="text-3xl">🧑‍🎓</span>
              <h2 className="mt-2 text-xl font-extrabold">
                {editandoId ? "Editar estudiante" : "Registrar estudiante"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Completá la información del estudiante.
              </p>
            </div>

            <form onSubmit={guardarEstudiante} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Nombre completo *
                </label>
                <input
                  value={formulario.nombre_completo}
                  onChange={(e) =>
                    actualizarCampo("nombre_completo", e.target.value)
                  }
                  placeholder="Nombre y apellidos"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Grupo *
                </label>
                <select
                  value={formulario.grupo_id}
                  onChange={(e) => actualizarCampo("grupo_id", e.target.value)}
                  required
                  disabled={grupos.length === 0}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-purple-500 disabled:bg-slate-100"
                >
                  <option value="">Seleccionar grupo</option>
                  {grupos.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.nombre}
                      {grupo.seccion ? ` · ${grupo.seccion}` : ""}
                      {" · "}
                      {grupo.curso_lectivo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Identificación
                </label>
                <input
                  value={formulario.identificacion}
                  onChange={(e) =>
                    actualizarCampo("identificacion", e.target.value)
                  }
                  placeholder="Número de identificación (opcional)"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  value={formulario.fecha_nacimiento}
                  onChange={(e) =>
                    actualizarCampo("fecha_nacimiento", e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Observaciones
                </label>
                <textarea
                  value={formulario.observaciones}
                  onChange={(e) =>
                    actualizarCampo("observaciones", e.target.value)
                  }
                  rows={3}
                  placeholder="Información adicional..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={guardando || grupos.length === 0}
                className="w-full rounded-xl bg-purple-700 px-5 py-3 font-bold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando
                  ? "Guardando..."
                  : editandoId
                    ? "Actualizar estudiante"
                    : "Guardar estudiante"}
              </button>

              {editandoId && (
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="w-full rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar edición
                </button>
              )}
            </form>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold">
                  Estudiantes registrados
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Listado de tus estudiantes.
                </p>
              </div>

              <div className="rounded-2xl bg-purple-100 px-4 py-3 text-center">
                <p className="text-2xl font-extrabold text-purple-800">
                  {estudiantes.length}
                </p>
                <p className="text-xs font-semibold text-purple-700">
                  Estudiantes
                </p>
              </div>
            </div>

            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, identificación o grupo..."
              className="mb-5 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500"
            />

            {estudiantesFiltrados.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                <span className="text-6xl">📚</span>
                <h3 className="mt-4 font-bold">
                  {estudiantes.length === 0
                    ? "Todavía no hay estudiantes registrados"
                    : "No encontramos resultados"}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {estudiantes.length === 0
                    ? "Utilizá el formulario para agregar el primero."
                    : "Probá con otro nombre, identificación o grupo."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {estudiantesFiltrados.map((estudiante) => {
                  const grupo = grupos.find(
                    (g) => g.id === estudiante.grupo_id
                  );

                  return (
                    <article
                      key={estudiante.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="break-words font-extrabold">
                            {estudiante.nombre_completo}
                          </h3>

                          <p className="mt-1 text-sm text-slate-600">
                            Grupo: {grupo?.nombre || "Grupo no disponible"}
                          </p>

                          {estudiante.identificacion && (
                            <p className="mt-1 text-xs text-slate-500">
                              Identificación: {estudiante.identificacion}
                            </p>
                          )}

                          {estudiante.fecha_nacimiento && (
                            <p className="mt-1 text-xs text-slate-500">
                              Nacimiento: {estudiante.fecha_nacimiento}
                            </p>
                          )}

                          {estudiante.observaciones && (
                            <p className="mt-2 break-words text-sm text-slate-600">
                              {estudiante.observaciones}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => prepararEdicion(estudiante)}
                            className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => eliminarEstudiante(estudiante.id)}
                            className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
