
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Grupo = {
  id: string;
  nombre: string;
  nivel: string | null;
  seccion: string | null;
};

type Estudiante = {
  id: string;
  nombre_completo: string;
  grupo_id: string;
};

type Registro = {
  id: string;
  grupo_id: string;
  estudiante_id: string | null;
  fecha: string;
  asignatura: string | null;
  area: string | null;
  actividad: string;
  objetivo_aprendizaje: string | null;
  logros: string | null;
  dificultades: string | null;
  apoyos_estrategias: string | null;
  observaciones: string | null;
  seguimiento: string | null;
};

const fechaActual = () => {
  const hoy = new Date();
  const zona = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000);
  return zona.toISOString().slice(0, 10);
};

const FORMULARIO_INICIAL = {
  grupo_id: "",
  estudiante_id: "",
  fecha: fechaActual(),
  asignatura: "",
  area: "",
  actividad: "",
  objetivo_aprendizaje: "",
  logros: "",
  dificultades: "",
  apoyos_estrategias: "",
  observaciones: "",
  seguimiento: "",
};

export default function BitacoraDocentePage() {
  const [docenteId, setDocenteId] = useState("");
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [registroEditando, setRegistroEditando] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarInformacion();
  }, []);

  async function cargarInformacion() {
    setCargando(true);
    setError("");

    const {
      data: { user },
      error: errorUsuario,
    } = await supabase.auth.getUser();

    if (errorUsuario || !user) {
      setError("No se pudo identificar la sesión. Iniciá sesión nuevamente.");
      setCargando(false);
      return;
    }

    setDocenteId(user.id);

    const [respuestaGrupos, respuestaEstudiantes, respuestaRegistros] =
      await Promise.all([
        supabase
          .from("grupos")
          .select("id, nombre, nivel, seccion")
          .eq("docente_id", user.id)
          .order("nombre"),

        supabase
          .from("estudiantes")
          .select("id, nombre_completo, grupo_id")
          .eq("docente_id", user.id)
          .order("nombre_completo"),

        supabase
          .from("bitacora")
          .select("*")
          .eq("docente_id", user.id)
          .order("fecha", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

    if (respuestaGrupos.error) {
      setError("No se pudieron cargar los grupos: " + respuestaGrupos.error.message);
    } else {
      setGrupos((respuestaGrupos.data || []) as Grupo[]);
    }

    if (respuestaEstudiantes.error) {
      setError("No se pudieron cargar los estudiantes: " + respuestaEstudiantes.error.message);
    } else {
      setEstudiantes((respuestaEstudiantes.data || []) as Estudiante[]);
    }

    if (respuestaRegistros.error) {
      setError("No se pudo cargar la bitácora: " + respuestaRegistros.error.message);
    } else {
      setRegistros((respuestaRegistros.data || []) as Registro[]);
    }

    setCargando(false);
  }

  const estudiantesDelGrupo = useMemo(() => {
    if (!formulario.grupo_id) return [];
    return estudiantes.filter(
      (estudiante) => estudiante.grupo_id === formulario.grupo_id
    );
  }, [estudiantes, formulario.grupo_id]);

  const registrosFiltrados = useMemo(() => {
    const termino = busqueda.toLowerCase().trim();

    return registros.filter((registro) => {
      const grupo = grupos.find((g) => g.id === registro.grupo_id);
      const estudiante = estudiantes.find(
        (e) => e.id === registro.estudiante_id
      );

      const coincideGrupo =
        !filtroGrupo || registro.grupo_id === filtroGrupo;

      const texto = [
        registro.actividad,
        registro.asignatura,
        registro.area,
        registro.logros,
        registro.dificultades,
        grupo?.nombre,
        estudiante?.nombre_completo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return coincideGrupo && (!termino || texto.includes(termino));
    });
  }, [registros, grupos, estudiantes, busqueda, filtroGrupo]);

  function cambiarCampo(
    campo: keyof typeof FORMULARIO_INICIAL,
    valor: string
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
      ...(campo === "grupo_id" ? { estudiante_id: "" } : {}),
    }));
  }

  function limpiarFormulario() {
    setFormulario({
      ...FORMULARIO_INICIAL,
      fecha: fechaActual(),
    });
    setRegistroEditando(null);
  }

  async function guardarRegistro(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!docenteId) {
      setError("No se encontró el usuario docente.");
      return;
    }

    if (!formulario.grupo_id || !formulario.actividad.trim()) {
      setError("Seleccioná un grupo y escribí la actividad realizada.");
      return;
    }

    setGuardando(true);

    const datos = {
      docente_id: docenteId,
      grupo_id: formulario.grupo_id,
      estudiante_id: formulario.estudiante_id || null,
      fecha: formulario.fecha,
      asignatura: formulario.asignatura.trim() || null,
      area: formulario.area.trim() || null,
      actividad: formulario.actividad.trim(),
      objetivo_aprendizaje: formulario.objetivo_aprendizaje.trim() || null,
      logros: formulario.logros.trim() || null,
      dificultades: formulario.dificultades.trim() || null,
      apoyos_estrategias: formulario.apoyos_estrategias.trim() || null,
      observaciones: formulario.observaciones.trim() || null,
      seguimiento: formulario.seguimiento.trim() || null,
    };

    const respuesta = registroEditando
      ? await supabase
          .from("bitacora")
          .update(datos)
          .eq("id", registroEditando)
          .eq("docente_id", docenteId)
      : await supabase.from("bitacora").insert(datos);

    if (respuesta.error) {
      setError("No se pudo guardar el registro: " + respuesta.error.message);
    } else {
      setMensaje(
        registroEditando
          ? "Registro actualizado correctamente."
          : "Registro guardado correctamente."
      );
      limpiarFormulario();
      await cargarInformacion();
    }

    setGuardando(false);
  }

  function editarRegistro(registro: Registro) {
    setFormulario({
      grupo_id: registro.grupo_id,
      estudiante_id: registro.estudiante_id || "",
      fecha: registro.fecha,
      asignatura: registro.asignatura || "",
      area: registro.area || "",
      actividad: registro.actividad || "",
      objetivo_aprendizaje: registro.objetivo_aprendizaje || "",
      logros: registro.logros || "",
      dificultades: registro.dificultades || "",
      apoyos_estrategias: registro.apoyos_estrategias || "",
      observaciones: registro.observaciones || "",
      seguimiento: registro.seguimiento || "",
    });
    setRegistroEditando(registro.id);
    setMensaje("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function eliminarRegistro(id: string) {
    const confirmar = window.confirm(
      "¿Deseás eliminar este registro de la bitácora?"
    );

    if (!confirmar) return;

    setError("");
    setMensaje("");

    const { error: errorEliminar } = await supabase
      .from("bitacora")
      .delete()
      .eq("id", id)
      .eq("docente_id", docenteId);

    if (errorEliminar) {
      setError("No se pudo eliminar: " + errorEliminar.message);
      return;
    }

    setMensaje("Registro eliminado correctamente.");
    await cargarInformacion();
  }

  function nombreGrupo(id: string) {
    const grupo = grupos.find((g) => g.id === id);
    return grupo
      ? `${grupo.nombre}${grupo.nivel ? ` · ${grupo.nivel}` : ""}${grupo.seccion ? ` · ${grupo.seccion}` : ""}`
      : "Grupo";
  }

  function nombreEstudiante(id: string | null) {
    if (!id) return "Trabajo grupal";
    return (
      estudiantes.find((e) => e.id === id)?.nombre_completo ||
      "Estudiante"
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-indigo-950 to-blue-800 p-6 text-white shadow-lg md:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-200">
              CAMPUS MR 2.0 · Área docente
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              <span aria-hidden="true">←</span>
              Volver al dashboard
            </Link>
          </div>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">
            Bitácora docente
          </h1>
          <p className="mt-2 max-w-2xl text-blue-100">
            Registrá las actividades, los avances, las dificultades y los
            apoyos educativos realizados durante el proceso de enseñanza.
          </p>
          <div className="mt-5 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm">
            {registros.length} registros documentados
          </div>
        </header>

        {mensaje && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {registroEditando ? "Editar registro" : "Nuevo registro"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Completá la información del trabajo realizado.
              </p>
            </div>
            {registroEditando && (
              <button
                type="button"
                onClick={limpiarFormulario}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar edición
              </button>
            )}
          </div>

          {grupos.length === 0 && !cargando ? (
            <div className="rounded-xl bg-amber-50 p-5 text-amber-800">
              Primero necesitás registrar al menos un grupo en el módulo
              <strong> Mis grupos</strong>.
            </div>
          ) : (
            <form onSubmit={guardarRegistro} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Grupo *
                  </label>
                  <select
                    required
                    value={formulario.grupo_id}
                    onChange={(e) => cambiarCampo("grupo_id", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-800 outline-none focus:border-indigo-500"
                  >
                    <option value="">Seleccionar grupo</option>
                    {grupos.map((grupo) => (
                      <option key={grupo.id} value={grupo.id}>
                        {nombreGrupo(grupo.id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Estudiante
                  </label>
                  <select
                    value={formulario.estudiante_id}
                    onChange={(e) =>
                      cambiarCampo("estudiante_id", e.target.value)
                    }
                    disabled={!formulario.grupo_id}
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-800 outline-none focus:border-indigo-500 disabled:bg-slate-100"
                  >
                    <option value="">Todo el grupo</option>
                    {estudiantesDelGrupo.map((estudiante) => (
                      <option key={estudiante.id} value={estudiante.id}>
                        {estudiante.nombre_completo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={formulario.fecha}
                    onChange={(e) => cambiarCampo("fecha", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-3 text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Asignatura
                  </label>
                  <select
                    value={formulario.asignatura}
                    onChange={(e) =>
                      cambiarCampo("asignatura", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-800 outline-none focus:border-indigo-500"
                  >
                    <option value="">Seleccionar asignatura</option>
                    <option>Español</option>
                    <option>Matemáticas</option>
                    <option>Ciencias</option>
                    <option>Estudios Sociales</option>
                    <option>Inglés</option>
                    <option>Educación Especial</option>
                    <option>Otra</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Área de trabajo
                  </label>
                  <input
                    value={formulario.area}
                    onChange={(e) => cambiarCampo("area", e.target.value)}
                    placeholder="Ej. Lectura, escritura, autonomía, comunicación..."
                    className="w-full rounded-xl border border-slate-300 p-3 text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Actividad realizada *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formulario.actividad}
                  onChange={(e) => cambiarCampo("actividad", e.target.value)}
                  placeholder="Describí la actividad desarrollada durante la lección..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Objetivo de aprendizaje
                </label>
                <textarea
                  rows={2}
                  value={formulario.objetivo_aprendizaje}
                  onChange={(e) =>
                    cambiarCampo("objetivo_aprendizaje", e.target.value)
                  }
                  placeholder="¿Qué aprendizaje se buscó desarrollar?"
                  className="w-full rounded-xl border border-slate-300 p-3 text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-green-700">
                    Logros y avances
                  </label>
                  <textarea
                    rows={3}
                    value={formulario.logros}
                    onChange={(e) => cambiarCampo("logros", e.target.value)}
                    placeholder="Describí los avances observados..."
                    className="w-full rounded-xl border border-green-200 p-3 text-slate-800 outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-amber-700">
                    Dificultades identificadas
                  </label>
                  <textarea
                    rows={3}
                    value={formulario.dificultades}
                    onChange={(e) =>
                      cambiarCampo("dificultades", e.target.value)
                    }
                    placeholder="¿Qué dificultades se presentaron?"
                    className="w-full rounded-xl border border-amber-200 p-3 text-slate-800 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-indigo-700">
                    Apoyos y estrategias aplicadas
                  </label>
                  <textarea
                    rows={3}
                    value={formulario.apoyos_estrategias}
                    onChange={(e) =>
                      cambiarCampo("apoyos_estrategias", e.target.value)
                    }
                    placeholder="Apoyos educativos, recursos, estrategias y ajustes utilizados..."
                    className="w-full rounded-xl border border-indigo-200 p-3 text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Observaciones
                  </label>
                  <textarea
                    rows={3}
                    value={formulario.observaciones}
                    onChange={(e) =>
                      cambiarCampo("observaciones", e.target.value)
                    }
                    placeholder="Anotaciones relevantes..."
                    className="w-full rounded-xl border border-slate-300 p-3 text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Seguimiento
                </label>
                <textarea
                  rows={2}
                  value={formulario.seguimiento}
                  onChange={(e) =>
                    cambiarCampo("seguimiento", e.target.value)
                  }
                  placeholder="¿Qué acciones o actividades deben retomarse?"
                  className="w-full rounded-xl border border-slate-300 p-3 text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={guardando || cargando}
                  className="rounded-xl bg-indigo-700 px-6 py-3 font-bold text-white shadow hover:bg-indigo-800 disabled:opacity-50"
                >
                  {guardando
                    ? "Guardando..."
                    : registroEditando
                      ? "Actualizar registro"
                      : "Guardar en bitácora"}
                </button>
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Limpiar formulario
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-800">
              Historial de bitácora
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Consultá, buscá, editá o eliminá tus registros.
            </p>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-2">
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar actividad, estudiante o contenido..."
              className="w-full rounded-xl border border-slate-300 p-3 text-slate-800 outline-none focus:border-indigo-500"
            />
            <select
              value={filtroGrupo}
              onChange={(e) => setFiltroGrupo(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-800 outline-none focus:border-indigo-500"
            >
              <option value="">Todos los grupos</option>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {nombreGrupo(grupo.id)}
                </option>
              ))}
            </select>
          </div>

          {cargando ? (
            <p className="py-8 text-center text-slate-500">
              Cargando bitácora...
            </p>
          ) : registrosFiltrados.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center text-slate-500">
              Todavía no hay registros para mostrar.
            </div>
          ) : (
            <div className="space-y-4">
              {registrosFiltrados.map((registro) => (
                <article
                  key={registro.id}
                  className="rounded-2xl border border-slate-200 p-5 transition hover:border-indigo-200"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-indigo-700">
                        {registro.fecha}
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-slate-800">
                        {registro.actividad}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {nombreGrupo(registro.grupo_id)} ·{" "}
                        {nombreEstudiante(registro.estudiante_id)}
                      </p>
                      {(registro.asignatura || registro.area) && (
                        <p className="mt-2 text-sm font-medium text-slate-600">
                          {[registro.asignatura, registro.area]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => editarRegistro(registro)}
                        className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminarRegistro(registro.id)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {registro.objetivo_aprendizaje && (
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase text-slate-500">
                          Objetivo
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                          {registro.objetivo_aprendizaje}
                        </p>
                      </div>
                    )}

                    {registro.logros && (
                      <div className="rounded-xl bg-green-50 p-3">
                        <p className="text-xs font-bold uppercase text-green-700">
                          Logros
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                          {registro.logros}
                        </p>
                      </div>
                    )}

                    {registro.dificultades && (
                      <div className="rounded-xl bg-amber-50 p-3">
                        <p className="text-xs font-bold uppercase text-amber-700">
                          Dificultades
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                          {registro.dificultades}
                        </p>
                      </div>
                    )}

                    {registro.apoyos_estrategias && (
                      <div className="rounded-xl bg-indigo-50 p-3">
                        <p className="text-xs font-bold uppercase text-indigo-700">
                          Apoyos y estrategias
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                          {registro.apoyos_estrategias}
                        </p>
                      </div>
                    )}

                    {registro.observaciones && (
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-bold uppercase text-slate-500">
                          Observaciones
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                          {registro.observaciones}
                        </p>
                      </div>
                    )}

                    {registro.seguimiento && (
                      <div className="rounded-xl bg-blue-50 p-3">
                        <p className="text-xs font-bold uppercase text-blue-700">
                          Seguimiento
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                          {registro.seguimiento}
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
