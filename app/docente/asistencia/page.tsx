
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, UsuarioActual } from "@/lib/auth";

type EstadoAsistencia = "presente" | "ausente" | "tardia" | "justificado";

interface Grupo {
  id: string;
  nombre: string;
  nivel: string | null;
  seccion: string | null;
}

interface Estudiante {
  id: string;
  nombre_completo: string;
  identificacion: string | null;
}

const ESTADOS: {
  valor: EstadoAsistencia;
  nombre: string;
  color: string;
}[] = [
  {
    valor: "presente",
    nombre: "Presente",
    color: "bg-green-600 text-white",
  },
  {
    valor: "ausente",
    nombre: "Ausente",
    color: "bg-red-600 text-white",
  },
  {
    valor: "tardia",
    nombre: "Tardía",
    color: "bg-amber-500 text-white",
  },
  {
    valor: "justificado",
    nombre: "Justificado",
    color: "bg-blue-600 text-white",
  },
];

function fechaLocal() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export default function AsistenciaPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [grupoId, setGrupoId] = useState("");
  const [fecha, setFecha] = useState(fechaLocal());
  const [estados, setEstados] = useState<
    Record<string, EstadoAsistencia>
  >({});
  const [observaciones, setObservaciones] = useState<
    Record<string, string>
  >({});
  const [cargando, setCargando] = useState(true);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [guardando, setGuardando] = useState(false);
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

      const { data, error } = await supabase
        .from("grupos")
        .select("id, nombre, nivel, seccion")
        .eq("docente_id", usuarioActual.id)
        .order("nombre");

      if (!activo) return;

      if (error) {
        setError("No se pudieron cargar los grupos: " + error.message);
      } else {
        const lista = (data || []) as Grupo[];
        setGrupos(lista);

        if (lista.length > 0) {
          setGrupoId(lista[0].id);
        }
      }

      setCargando(false);
    }

    iniciar();

    return () => {
      activo = false;
    };
  }, [router]);

  useEffect(() => {
    let activo = true;

    async function cargarLista() {
      if (!usuario || !grupoId || !fecha) {
        setEstudiantes([]);
        setEstados({});
        setObservaciones({});
        return;
      }

      setCargandoLista(true);
      setMensaje("");
      setError("");

      const { data: listaEstudiantes, error: errorEstudiantes } =
        await supabase
          .from("estudiantes")
          .select("id, nombre_completo, identificacion")
          .eq("docente_id", usuario.id)
          .eq("grupo_id", grupoId)
          .order("nombre_completo");

      if (!activo) return;

      if (errorEstudiantes) {
        setError(
          "No se pudieron cargar los estudiantes: " +
            errorEstudiantes.message
        );
        setCargandoLista(false);
        return;
      }

      const estudiantesActuales = (listaEstudiantes || []) as Estudiante[];
      setEstudiantes(estudiantesActuales);

      if (estudiantesActuales.length === 0) {
        setEstados({});
        setObservaciones({});
        setCargandoLista(false);
        return;
      }

      const { data: registros, error: errorRegistros } = await supabase
        .from("asistencias")
        .select("estudiante_id, estado, observaciones")
        .eq("docente_id", usuario.id)
        .eq("grupo_id", grupoId)
        .eq("fecha", fecha);

      if (!activo) return;

      if (errorRegistros) {
        setError(
          "No se pudieron cargar las asistencias: " +
            errorRegistros.message
        );
        setCargandoLista(false);
        return;
      }

      const nuevosEstados: Record<string, EstadoAsistencia> = {};
      const nuevasObservaciones: Record<string, string> = {};

      estudiantesActuales.forEach((estudiante) => {
        nuevosEstados[estudiante.id] = "presente";
        nuevasObservaciones[estudiante.id] = "";
      });

      (registros || []).forEach((registro) => {
        nuevosEstados[registro.estudiante_id] =
          registro.estado as EstadoAsistencia;
        nuevasObservaciones[registro.estudiante_id] =
          registro.observaciones || "";
      });

      setEstados(nuevosEstados);
      setObservaciones(nuevasObservaciones);
      setCargandoLista(false);
    }

    cargarLista();

    return () => {
      activo = false;
    };
  }, [usuario, grupoId, fecha]);

  function cambiarEstado(
    estudianteId: string,
    estado: EstadoAsistencia
  ) {
    setEstados((actuales) => ({
      ...actuales,
      [estudianteId]: estado,
    }));
  }

  function cambiarObservacion(estudianteId: string, valor: string) {
    setObservaciones((actuales) => ({
      ...actuales,
      [estudianteId]: valor,
    }));
  }

  function marcarTodos(estado: EstadoAsistencia) {
    const nuevos: Record<string, EstadoAsistencia> = {};

    estudiantes.forEach((estudiante) => {
      nuevos[estudiante.id] = estado;
    });

    setEstados(nuevos);
  }

  async function guardarAsistencia() {
    if (!usuario || !grupoId || estudiantes.length === 0) return;

    setGuardando(true);
    setMensaje("");
    setError("");

    const registros = estudiantes.map((estudiante) => ({
      docente_id: usuario.id,
      grupo_id: grupoId,
      estudiante_id: estudiante.id,
      fecha,
      estado: estados[estudiante.id] || "presente",
      observaciones: observaciones[estudiante.id]?.trim() || null,
    }));

    const { error } = await supabase
      .from("asistencias")
      .upsert(registros, {
        onConflict: "estudiante_id,fecha",
      });

    setGuardando(false);

    if (error) {
      setError("No se pudo guardar la asistencia: " + error.message);
      return;
    }

    setMensaje("¡Asistencia guardada correctamente!");
  }

  const resumen = {
    presente: estudiantes.filter(
      (e) => estados[e.id] === "presente"
    ).length,
    ausente: estudiantes.filter(
      (e) => estados[e.id] === "ausente"
    ).length,
    tardia: estudiantes.filter(
      (e) => estados[e.id] === "tardia"
    ).length,
    justificado: estudiantes.filter(
      (e) => estados[e.id] === "justificado"
    ).length,
  };

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f4fc]">
        <p className="font-semibold text-slate-600">
          Cargando control de asistencia...
        </p>
      </main>
    );
  }

  if (!usuario) return null;

  return (
    <main className="min-h-screen bg-[#f5f4fc] p-4 text-[#17213f] sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 rounded-3xl bg-gradient-to-r from-indigo-950 via-purple-900 to-purple-700 p-6 text-white shadow-lg sm:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-semibold uppercase tracking-wider text-purple-200">
              CAMPUS MR 2.0 · Área docente
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              <span aria-hidden="true">←</span>
              Volver al dashboard
            </Link>
          </div>

          <h1 className="text-3xl font-extrabold sm:text-4xl">
            Control de asistencia
          </h1>

          <p className="mt-2 max-w-2xl text-purple-100">
            Registrá y consultá la asistencia de tus estudiantes.
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

        <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-xl font-extrabold">
            Seleccionar grupo y fecha
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Grupo
              </label>

              <select
                value={grupoId}
                onChange={(e) => setGrupoId(e.target.value)}
                disabled={grupos.length === 0}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-purple-500"
              >
                {grupos.length === 0 && (
                  <option value="">No hay grupos registrados</option>
                )}

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
                Fecha de asistencia
              </label>

              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </section>

        {grupos.length === 0 ? (
          <section className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <span className="text-5xl">🏫</span>
            <h2 className="mt-4 text-xl font-bold">
              Primero necesitás registrar un grupo.
            </h2>
            <Link
              href="/docente/grupos"
              className="mt-5 inline-block rounded-xl bg-purple-700 px-5 py-3 font-bold text-white"
            >
              Ir a Mis grupos →
            </Link>
          </section>
        ) : cargandoLista ? (
          <section className="rounded-3xl bg-white p-10 text-center shadow-sm">
            Cargando estudiantes y asistencia...
          </section>
        ) : estudiantes.length === 0 ? (
          <section className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <span className="text-5xl">🧑‍🎓</span>
            <h2 className="mt-4 text-xl font-bold">
              Este grupo todavía no tiene estudiantes.
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Registrá estudiantes antes de tomar la asistencia.
            </p>
            <Link
              href="/docente/estudiantes"
              className="mt-5 inline-block rounded-xl bg-purple-700 px-5 py-3 font-bold text-white"
            >
              Ir a Estudiantes →
            </Link>
          </section>
        ) : (
          <>
            <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-green-100 p-4">
                <p className="text-sm font-semibold text-green-800">
                  Presentes
                </p>
                <p className="text-3xl font-extrabold text-green-900">
                  {resumen.presente}
                </p>
              </div>

              <div className="rounded-2xl bg-red-100 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Ausentes
                </p>
                <p className="text-3xl font-extrabold text-red-900">
                  {resumen.ausente}
                </p>
              </div>

              <div className="rounded-2xl bg-amber-100 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  Tardías
                </p>
                <p className="text-3xl font-extrabold text-amber-900">
                  {resumen.tardia}
                </p>
              </div>

              <div className="rounded-2xl bg-blue-100 p-4">
                <p className="text-sm font-semibold text-blue-800">
                  Justificados
                </p>
                <p className="text-3xl font-extrabold text-blue-900">
                  {resumen.justificado}
                </p>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold">
                    Lista de estudiantes
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {estudiantes.length} estudiantes en este grupo.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => marcarTodos("presente")}
                  className="rounded-xl bg-green-100 px-4 py-2 text-sm font-bold text-green-800 hover:bg-green-200"
                >
                  Todos presentes
                </button>
              </div>

              <div className="space-y-4">
                {estudiantes.map((estudiante, indice) => (
                  <article
                    key={estudiante.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 font-extrabold text-purple-800">
                        {indice + 1}
                      </div>

                      <div className="min-w-0">
                        <h3 className="break-words font-bold">
                          {estudiante.nombre_completo}
                        </h3>
                        {estudiante.identificacion && (
                          <p className="text-xs text-slate-500">
                            {estudiante.identificacion}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {ESTADOS.map((estado) => (
                        <button
                          key={estado.valor}
                          type="button"
                          onClick={() =>
                            cambiarEstado(estudiante.id, estado.valor)
                          }
                          className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                            estados[estudiante.id] === estado.valor
                              ? `${estado.color} border-transparent shadow-sm`
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {estado.nombre}
                        </button>
                      ))}
                    </div>

                    <input
                      value={observaciones[estudiante.id] || ""}
                      onChange={(e) =>
                        cambiarObservacion(estudiante.id, e.target.value)
                      }
                      placeholder="Observaciones (opcional)"
                      className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-purple-500"
                    />
                  </article>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Revisá los estados antes de guardar.
                </p>

                <button
                  type="button"
                  onClick={guardarAsistencia}
                  disabled={guardando}
                  className="rounded-xl bg-purple-700 px-7 py-4 font-bold text-white shadow-sm transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {guardando ? "Guardando..." : "Guardar asistencia"}
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
