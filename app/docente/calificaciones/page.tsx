
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
}

interface Estudiante {
  id: string;
  nombre_completo: string;
  grupo_id: string;
}

interface Calificacion {
  id: string;
  estudiante_id: string;
  grupo_id: string;
  asignatura: string;
  periodo: string;
  actividad: string;
  nota: number;
  porcentaje: number | null;
  observaciones: string | null;
}

const FORMULARIO_INICIAL = {
  grupo_id: "",
  estudiante_id: "",
  asignatura: "Español",
  periodo: "I período",
  actividad: "",
  nota: "",
  porcentaje: "",
  observaciones: "",
};

export default function CalificacionesPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [busqueda, setBusqueda] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("todos");
  const [filtroAsignatura, setFiltroAsignatura] = useState("todas");
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

      const [resultadoGrupos, resultadoEstudiantes, resultadoNotas] =
        await Promise.all([
          supabase
            .from("grupos")
            .select("id, nombre, nivel, seccion")
            .eq("docente_id", usuarioActual.id)
            .order("nombre"),

          supabase
            .from("estudiantes")
            .select("id, nombre_completo, grupo_id")
            .eq("docente_id", usuarioActual.id)
            .order("nombre_completo"),

          supabase
            .from("calificaciones")
            .select(
              "id, estudiante_id, grupo_id, asignatura, periodo, actividad, nota, porcentaje, observaciones"
            )
            .eq("docente_id", usuarioActual.id)
            .order("created_at", { ascending: false }),
        ]);

      if (!activo) return;

      if (resultadoGrupos.error) {
        setError("Error al cargar grupos: " + resultadoGrupos.error.message);
      } else {
        setGrupos((resultadoGrupos.data || []) as Grupo[]);
      }

      if (resultadoEstudiantes.error) {
        setError(
          "Error al cargar estudiantes: " + resultadoEstudiantes.error.message
        );
      } else {
        setEstudiantes((resultadoEstudiantes.data || []) as Estudiante[]);
      }

      if (resultadoNotas.error) {
        setError(
          "Error al cargar calificaciones: " + resultadoNotas.error.message
        );
      } else {
        setCalificaciones((resultadoNotas.data || []) as Calificacion[]);
      }

      setCargando(false);
    }

    iniciar();

    return () => {
      activo = false;
    };
  }, [router]);

  function actualizarCampo(
    campo: keyof typeof FORMULARIO_INICIAL,
    valor: string
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  function limpiarFormulario() {
    setFormulario(FORMULARIO_INICIAL);
    setEditandoId(null);
  }

  async function cargarCalificaciones(docenteId: string) {
    const { data, error } = await supabase
      .from("calificaciones")
      .select(
        "id, estudiante_id, grupo_id, asignatura, periodo, actividad, nota, porcentaje, observaciones"
      )
      .eq("docente_id", docenteId)
      .order("created_at", { ascending: false });

    if (error) {
      setError("No se pudo actualizar la lista: " + error.message);
      return;
    }

    setCalificaciones((data || []) as Calificacion[]);
  }

  async function guardarCalificacion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!usuario) return;

    setMensaje("");
    setError("");

    const nota = Number(formulario.nota);
    const porcentaje =
      formulario.porcentaje.trim() === ""
        ? null
        : Number(formulario.porcentaje);

    if (!formulario.grupo_id || !formulario.estudiante_id) {
      setError("Seleccioná el grupo y el estudiante.");
      return;
    }

    if (!formulario.actividad.trim()) {
      setError("Escribí el nombre de la actividad evaluativa.");
      return;
    }

    if (
      formulario.nota.trim() === "" ||
      !Number.isFinite(nota) ||
      nota < 0 ||
      nota > 100
    ) {
      setError("La nota debe ser un número entre 0 y 100.");
      return;
    }

    if (
      porcentaje !== null &&
      (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100)
    ) {
      setError("El porcentaje debe estar entre 0 y 100.");
      return;
    }

    const estudianteValido = estudiantes.some(
      (e) =>
        e.id === formulario.estudiante_id &&
        e.grupo_id === formulario.grupo_id
    );

    if (!estudianteValido) {
      setError("El estudiante seleccionado no pertenece a ese grupo.");
      return;
    }

    setGuardando(true);

    const datos = {
      docente_id: usuario.id,
      grupo_id: formulario.grupo_id,
      estudiante_id: formulario.estudiante_id,
      asignatura: formulario.asignatura,
      periodo: formulario.periodo,
      actividad: formulario.actividad.trim(),
      nota,
      porcentaje,
      observaciones: formulario.observaciones.trim() || null,
    };

    const resultado = editandoId
      ? await supabase
          .from("calificaciones")
          .update(datos)
          .eq("id", editandoId)
          .eq("docente_id", usuario.id)
      : await supabase.from("calificaciones").insert(datos);

    setGuardando(false);

    if (resultado.error) {
      setError("No se pudo guardar: " + resultado.error.message);
      return;
    }

    setMensaje(
      editandoId
        ? "Calificación actualizada correctamente."
        : "Calificación registrada correctamente."
    );

    limpiarFormulario();
    await cargarCalificaciones(usuario.id);
  }

  function prepararEdicion(nota: Calificacion) {
    setEditandoId(nota.id);

    setFormulario({
      grupo_id: nota.grupo_id,
      estudiante_id: nota.estudiante_id,
      asignatura: nota.asignatura,
      periodo: nota.periodo,
      actividad: nota.actividad,
      nota: String(nota.nota),
      porcentaje:
        nota.porcentaje === null ? "" : String(nota.porcentaje),
      observaciones: nota.observaciones || "",
    });

    setMensaje("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function eliminarCalificacion(id: string) {
    if (!usuario) return;

    const confirmar = window.confirm(
      "¿Deseás eliminar esta calificación? Esta acción no se puede deshacer."
    );

    if (!confirmar) return;

    setMensaje("");
    setError("");

    const { error } = await supabase
      .from("calificaciones")
      .delete()
      .eq("id", id)
      .eq("docente_id", usuario.id);

    if (error) {
      setError("No se pudo eliminar: " + error.message);
      return;
    }

    setMensaje("Calificación eliminada correctamente.");
    await cargarCalificaciones(usuario.id);
  }

  const estudiantesDelGrupo = estudiantes.filter(
    (e) => e.grupo_id === formulario.grupo_id
  );

  const calificacionesFiltradas = calificaciones.filter((nota) => {
    const estudiante = estudiantes.find(
      (e) => e.id === nota.estudiante_id
    );

    const termino = busqueda.toLowerCase().trim();

    const coincideBusqueda =
      (estudiante?.nombre_completo || "").toLowerCase().includes(termino) ||
      nota.actividad.toLowerCase().includes(termino);

    const coincideGrupo =
      filtroGrupo === "todos" || nota.grupo_id === filtroGrupo;

    const coincideAsignatura =
      filtroAsignatura === "todas" ||
      nota.asignatura === filtroAsignatura;

    return coincideBusqueda && coincideGrupo && coincideAsignatura;
  });

  const promedio =
    calificacionesFiltradas.length > 0
      ? calificacionesFiltradas.reduce(
          (total, item) => total + Number(item.nota),
          0
        ) / calificacionesFiltradas.length
      : null;

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f4fc]">
        <p className="font-semibold text-slate-600">
          Cargando calificaciones...
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
            Calificaciones académicas
          </h1>

          <p className="mt-2 text-slate-600">
            Registro y seguimiento del rendimiento de tus estudiantes.
          </p>
        </header>

        {mensaje && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 font-semibold text-green-800">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Calificaciones registradas
            </p>
            <p className="mt-2 text-3xl font-extrabold">
              {calificaciones.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Promedio de la lista filtrada
            </p>
            <p className="mt-2 text-3xl font-extrabold">
              {promedio === null ? "—" : promedio.toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Estudiantes registrados
            </p>
            <p className="mt-2 text-3xl font-extrabold">
              {estudiantes.length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-6">
              <span className="text-3xl">📝</span>
              <h2 className="mt-2 text-xl font-extrabold">
                {editandoId ? "Editar calificación" : "Registrar calificación"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Ingresá los datos de la evaluación académica.
              </p>
            </div>

            {grupos.length === 0 || estudiantes.length === 0 ? (
              <div className="rounded-2xl bg-amber-50 p-5 text-sm text-amber-900">
                Primero necesitás registrar grupos y estudiantes.
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    href="/docente/grupos"
                    className="font-bold underline"
                  >
                    Registrar grupos
                  </Link>
                  <Link
                    href="/docente/estudiantes"
                    className="font-bold underline"
                  >
                    Registrar estudiantes
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={guardarCalificacion} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Grupo *
                  </label>
                  <select
                    value={formulario.grupo_id}
                    onChange={(e) => {
                      setFormulario((actual) => ({
                        ...actual,
                        grupo_id: e.target.value,
                        estudiante_id: "",
                      }));
                    }}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-purple-500"
                  >
                    <option value="">Seleccionar grupo</option>
                    {grupos.map((grupo) => (
                      <option key={grupo.id} value={grupo.id}>
                        {grupo.nombre}
                        {grupo.seccion ? ` · ${grupo.seccion}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Estudiante *
                  </label>
                  <select
                    value={formulario.estudiante_id}
                    onChange={(e) =>
                      actualizarCampo("estudiante_id", e.target.value)
                    }
                    required
                    disabled={!formulario.grupo_id}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-purple-500 disabled:bg-slate-100"
                  >
                    <option value="">Seleccionar estudiante</option>
                    {estudiantesDelGrupo.map((estudiante) => (
                      <option key={estudiante.id} value={estudiante.id}>
                        {estudiante.nombre_completo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Asignatura *
                  </label>
                  <select
                    value={formulario.asignatura}
                    onChange={(e) =>
                      actualizarCampo("asignatura", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-purple-500"
                  >
                    <option>Español</option>
                    <option>Matemáticas</option>
                    <option>Ciencias</option>
                    <option>Estudios Sociales</option>
                    <option>Inglés</option>
                    <option>Educación Física</option>
                    <option>Educación Musical</option>
                    <option>Artes Plásticas</option>
                    <option>Otra</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Período académico *
                  </label>
                  <select
                    value={formulario.periodo}
                    onChange={(e) =>
                      actualizarCampo("periodo", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-purple-500"
                  >
                    <option>I período</option>
                    <option>II período</option>
                    <option>III período</option>
                    <option>I semestre</option>
                    <option>II semestre</option>
                    <option>Anual</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Actividad evaluativa *
                  </label>
                  <input
                    value={formulario.actividad}
                    onChange={(e) =>
                      actualizarCampo("actividad", e.target.value)
                    }
                    placeholder="Ejemplo: Trabajo cotidiano"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Nota (0 a 100) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formulario.nota}
                      onChange={(e) =>
                        actualizarCampo("nota", e.target.value)
                      }
                      placeholder="Ejemplo: 85"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Porcentaje (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formulario.porcentaje}
                      onChange={(e) =>
                        actualizarCampo("porcentaje", e.target.value)
                      }
                      placeholder="Opcional"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Observaciones
                  </label>
                  <textarea
                    rows={3}
                    value={formulario.observaciones}
                    onChange={(e) =>
                      actualizarCampo("observaciones", e.target.value)
                    }
                    placeholder="Comentarios sobre el desempeño..."
                    className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full rounded-xl bg-purple-700 px-5 py-3 font-bold text-white transition hover:bg-purple-800 disabled:opacity-60"
                >
                  {guardando
                    ? "Guardando..."
                    : editandoId
                      ? "Actualizar calificación"
                      : "Guardar calificación"}
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
            )}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-extrabold">
                Registro de calificaciones
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Consultá las notas registradas.
              </p>
            </div>

            <div className="mb-4 space-y-3">
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar estudiante o actividad..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500"
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select
                  value={filtroGrupo}
                  onChange={(e) => setFiltroGrupo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                >
                  <option value="todos">Todos los grupos</option>
                  {grupos.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.nombre}
                    </option>
                  ))}
                </select>

                <select
                  value={filtroAsignatura}
                  onChange={(e) => setFiltroAsignatura(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                >
                  <option value="todas">Todas las asignaturas</option>
                  <option>Español</option>
                  <option>Matemáticas</option>
                  <option>Ciencias</option>
                  <option>Estudios Sociales</option>
                  <option>Inglés</option>
                  <option>Educación Física</option>
                  <option>Educación Musical</option>
                  <option>Artes Plásticas</option>
                  <option>Otra</option>
                </select>
              </div>
            </div>

            {calificacionesFiltradas.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                <span className="text-5xl">📊</span>
                <p className="mt-4 font-bold">
                  No hay calificaciones para mostrar.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Las notas registradas aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {calificacionesFiltradas.map((nota) => {
                  const estudiante = estudiantes.find(
                    (e) => e.id === nota.estudiante_id
                  );

                  const grupo = grupos.find(
                    (g) => g.id === nota.grupo_id
                  );

                  return (
                    <article
                      key={nota.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="break-words font-extrabold">
                            {estudiante?.nombre_completo ||
                              "Estudiante no disponible"}
                          </h3>

                          <p className="mt-1 text-sm text-slate-600">
                            {grupo?.nombre || "Grupo"} · {nota.asignatura}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {nota.periodo} · {nota.actividad}
                          </p>

                          {nota.porcentaje !== null && (
                            <p className="mt-1 text-xs text-slate-500">
                              Valor porcentual: {nota.porcentaje}%
                            </p>
                          )}

                          {nota.observaciones && (
                            <p className="mt-2 break-words text-sm text-slate-600">
                              {nota.observaciones}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-3xl font-extrabold text-purple-800">
                            {Number(nota.nota).toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-500">Nota</p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2 border-t border-slate-200 pt-3">
                        <button
                          type="button"
                          onClick={() => prepararEdicion(nota)}
                          className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => eliminarCalificacion(nota.id)}
                          className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                        >
                          Eliminar
                        </button>
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
