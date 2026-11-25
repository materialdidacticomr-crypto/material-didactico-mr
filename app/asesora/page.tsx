
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, UsuarioActual } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const AVATARES: Record<string, string> = {
  "maestra-morena": "/avatares/maestra-morena.png",
  "maestra-clara": "/avatares/maestra-clara.png",
  "maestro-lentes": "/avatares/maestro-lentes.png",
  "maestro-barba": "/avatares/maestro-barba.png",
};

type Docente = {
  id: string;
  nombre: string;
  correo: string;
  activo: boolean;
};

type EstadisticaDocente = {
  docente_id: string;
  grupos: number;
  estudiantes: number;
  asistencias: number;
  calificaciones: number;
  bitacoras: number;
};

const AREAS = [
  { clave: "grupos", nombre: "Grupos", icono: "👥", color: "#A78BFA" },
  { clave: "estudiantes", nombre: "Estudiantes", icono: "🎓", color: "#60A5FA" },
  { clave: "asistencias", nombre: "Asistencias", icono: "📅", color: "#34D399" },
  { clave: "calificaciones", nombre: "Calificaciones", icono: "📋", color: "#FBBF24" },
  { clave: "bitacoras", nombre: "Bitácoras", icono: "📖", color: "#F472B6" },
] as const;

function contarPorDocente(
  registros: { docente_id: string | null }[] | null
): Record<string, number> {
  const resultado: Record<string, number> = {};

  (registros || []).forEach((registro) => {
    if (registro.docente_id) {
      resultado[registro.docente_id] =
        (resultado[registro.docente_id] || 0) + 1;
    }
  });

  return resultado;
}

export default function AsesoraPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [fechaHora, setFechaHora] = useState("");
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticaDocente[]>([]);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState("todos");
  const [errorEstadisticas, setErrorEstadisticas] = useState("");

  useEffect(() => {
    let activo = true;

    async function verificarUsuario() {
      const usuarioActual = await getCurrentUser();

      if (!activo) return;

      if (
        !usuarioActual ||
        !usuarioActual.activo ||
        usuarioActual.rol !== "asesora"
      ) {
        router.replace("/dashboard");
        return;
      }

      setUsuario(usuarioActual);
      setCargando(false);
    }

    verificarUsuario();

    return () => {
      activo = false;
    };
  }, [router]);

  useEffect(() => {
    function actualizarFechaHora() {
      const ahora = new Date();

      const fecha = ahora.toLocaleDateString("es-CR", {
        timeZone: "America/Costa_Rica",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const hora = ahora.toLocaleTimeString("es-CR", {
        timeZone: "America/Costa_Rica",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      setFechaHora(
        `${fecha.charAt(0).toUpperCase()}${fecha.slice(1)} · ${hora}`
      );
    }

    actualizarFechaHora();

    const intervalo = window.setInterval(actualizarFechaHora, 1000);

    return () => window.clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (!usuario) return;

    let activo = true;

    async function cargarAvatar() {
      const { data, error } = await supabase
        .from("usuarios")
        .select("avatar_tipo, avatar_seleccionado")
        .eq("id", usuario!.id)
        .single();

      if (!activo || error || !data) return;

      let imagen = "";

      if (data.avatar_tipo === "predeterminado" || !data.avatar_tipo) {
        imagen =
          AVATARES[data.avatar_seleccionado] ||
          AVATARES["maestra-morena"];
      } else if (data.avatar_seleccionado) {
        const { data: archivo, error: errorUrl } = await supabase.storage
          .from("avatares")
          .createSignedUrl(data.avatar_seleccionado, 3600);

        if (!errorUrl && archivo?.signedUrl) {
          imagen = archivo.signedUrl;
        }
      }

      if (activo) setAvatarUrl(imagen);
    }

    cargarAvatar();

    return () => {
      activo = false;
    };
  }, [usuario]);

  async function cargarEstadisticas() {
    setCargandoEstadisticas(true);
    setErrorEstadisticas("");

    try {
      const [
        respuestaDocentes,
        respuestaGrupos,
        respuestaEstudiantes,
        respuestaAsistencias,
        respuestaCalificaciones,
        respuestaBitacoras,
      ] = await Promise.all([
        supabase
          .from("usuarios")
          .select("id, nombre, correo, activo")
          .eq("rol", "docente")
          .order("nombre"),
        supabase.from("grupos").select("docente_id"),
        supabase.from("estudiantes").select("docente_id"),
        supabase.from("asistencias").select("docente_id"),
        supabase.from("calificaciones").select("docente_id"),
        supabase.from("bitacora").select("docente_id"),
      ]);

      const errores = [
        respuestaDocentes.error,
        respuestaGrupos.error,
        respuestaEstudiantes.error,
        respuestaAsistencias.error,
        respuestaCalificaciones.error,
        respuestaBitacoras.error,
      ].filter(Boolean);

      if (errores.length > 0) {
        throw new Error(
          errores.map((error) => error?.message).join(" | ")
        );
      }

      const listaDocentes = (respuestaDocentes.data || []) as Docente[];

      const grupos = contarPorDocente(respuestaGrupos.data);
      const estudiantes = contarPorDocente(respuestaEstudiantes.data);
      const asistencias = contarPorDocente(respuestaAsistencias.data);
      const calificaciones = contarPorDocente(
        respuestaCalificaciones.data
      );
      const bitacoras = contarPorDocente(respuestaBitacoras.data);

      const resumen = listaDocentes.map((docente) => ({
        docente_id: docente.id,
        grupos: grupos[docente.id] || 0,
        estudiantes: estudiantes[docente.id] || 0,
        asistencias: asistencias[docente.id] || 0,
        calificaciones: calificaciones[docente.id] || 0,
        bitacoras: bitacoras[docente.id] || 0,
      }));

      setDocentes(listaDocentes);
      setEstadisticas(resumen);
    } catch (error) {
      setErrorEstadisticas(
        error instanceof Error
          ? error.message
          : "No fue posible cargar las estadísticas."
      );
    } finally {
      setCargandoEstadisticas(false);
    }
  }

  useEffect(() => {
    if (!usuario) return;

    cargarEstadisticas();

    // Cargar estadísticas al validar la cuenta de asesora.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const totales = useMemo(() => {
    return estadisticas.reduce(
      (total, item) => ({
        grupos: total.grupos + item.grupos,
        estudiantes: total.estudiantes + item.estudiantes,
        asistencias: total.asistencias + item.asistencias,
        calificaciones: total.calificaciones + item.calificaciones,
        bitacoras: total.bitacoras + item.bitacoras,
      }),
      {
        grupos: 0,
        estudiantes: 0,
        asistencias: 0,
        calificaciones: 0,
        bitacoras: 0,
      }
    );
  }, [estadisticas]);

  const estadisticaActual = estadisticas.find(
    (item) => item.docente_id === docenteSeleccionado
  );

  const docenteActual = docentes.find(
    (item) => item.id === docenteSeleccionado
  );

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf5fb]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
          <p className="text-lg font-semibold text-purple-800">
            Cargando espacio de asesoría...
          </p>
        </div>
      </main>
    );
  }

  if (!usuario) return null;

  return (
    <main className="min-h-screen bg-[#faf7fc] text-[#382b49] lg:flex">
      <aside className="w-full shrink-0 border-r border-pink-100 bg-gradient-to-b from-[#f5dff0] via-[#f4e8f5] to-[#e9e2fa] px-5 py-6 text-[#513c60] lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[255px] lg:flex-col lg:overflow-y-auto">
        <div className="mb-9 rounded-3xl bg-white/75 px-4 py-5 text-center shadow-sm">
          <div className="relative mx-auto h-28 w-28">
            <Image
              src="/logo-material-didactico-mr.png"
              alt="Logo Material Didáctico MR"
              fill
              className="object-contain"
              priority
            />
          </div>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#52345f]">
            CAMPUS MR
          </h1>

          <div className="mt-1 text-3xl font-black text-[#a34b9c]">
            2.0
          </div>

          <p className="mt-3 text-[11px] font-bold tracking-[0.18em] text-[#93658f]">
            ESPACIO DE ASESORÍA
          </p>
        </div>

        <nav className="flex flex-col gap-3">
          <Link
            href="/asesora"
            className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[#b66ac0] to-[#9464c9] px-5 py-4 font-bold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-0.5"
          >
            <span className="text-2xl">🏠</span>
            <span>Inicio</span>
          </Link>

          <Link
            href="/perfil"
            className="flex items-center gap-4 rounded-2xl px-5 py-4 font-semibold text-[#654d72] transition hover:bg-white/80"
          >
            <span className="text-2xl">👤</span>
            <span>Mi perfil</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-4 rounded-2xl px-5 py-4 font-semibold text-[#654d72] transition hover:bg-white/80"
          >
            <span className="text-2xl">🌐</span>
            <span>Página principal</span>
          </Link>
        </nav>

        <div className="mt-9 rounded-3xl border border-white/70 bg-gradient-to-br from-[#d9b8ed] to-[#c8b8f1] p-5 text-center shadow-sm lg:mt-auto">
          <div className="text-4xl">🌟</div>
          <h3 className="mt-3 font-extrabold text-[#593d70]">
            Material Didáctico MR
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-[#624d76]">
            Un espacio para fortalecer el acompañamiento y la calidad educativa.
          </p>
        </div>

        <button
          onClick={cerrarSesion}
          className="mt-5 w-full rounded-2xl border border-[#d6b8dc] bg-white/70 px-4 py-4 font-bold text-[#76517e] transition hover:bg-white"
        >
          ↪ Cerrar sesión
        </button>
      </aside>

      <section className="min-w-0 flex-1 px-4 py-6 sm:px-7 lg:ml-[255px] lg:px-9 lg:py-8">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-wide text-[#a078a8]">
              CAMPUS MR 2.0 · PANEL DE CONTROL
            </p>
            <h2 className="mt-1 text-3xl font-black text-[#493254] sm:text-4xl">
              Mi espacio de asesoría
            </h2>
            <p className="mt-2 text-base text-[#806b89]">
              Supervisión y consulta de avances docentes.
            </p>
          </div>

          <Link
            href="/perfil"
            className="flex items-center gap-4 rounded-2xl border border-pink-100 bg-white px-5 py-3 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-purple-200 bg-purple-50">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar de la asesora"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <span className="text-3xl">👩‍🏫</span>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-[#a078a8]">
                CUENTA PERSONAL
              </p>
              <p className="text-lg font-extrabold text-[#543e60]">
                Mi perfil
              </p>
              <p className="text-xs text-[#987e9e]">Ver y editar</p>
            </div>
          </Link>
        </header>

        <section className="relative mb-8 overflow-hidden rounded-[30px] border border-purple-100 bg-gradient-to-r from-[#f1dcf5] via-[#eee3fa] to-[#e0eaff] p-6 shadow-md sm:p-9">
          <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full bg-white/30" />
          <div className="pointer-events-none absolute -bottom-24 right-1/4 h-64 w-64 rounded-full bg-pink-200/20" />

          <div className="relative flex flex-col items-center gap-7 md:flex-row">
            <div className="relative shrink-0">
              <div className="absolute -inset-3 rounded-full bg-white/60 blur-sm" />
              <div className="relative h-36 w-36 overflow-hidden rounded-full border-[6px] border-white bg-white shadow-xl sm:h-44 sm:w-44">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Avatar de la asesora"
                    fill
                    unoptimized
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-6xl">
                    👩‍🏫
                  </div>
                )}
              </div>

              <div className="absolute bottom-2 right-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-emerald-400 text-white shadow">
                ✓
              </div>
            </div>

            <div className="min-w-0 flex-1 text-center md:text-left">
              <span className="inline-flex rounded-full border border-purple-200 bg-white/70 px-4 py-2 text-xs font-extrabold tracking-widest text-purple-700">
                BIENVENIDA A CAMPUS MR 2.0
              </span>

              <h2 className="mt-4 text-3xl font-black leading-tight text-[#493254] sm:text-4xl lg:text-5xl">
                ¡Hola, {usuario.nombre}!
              </h2>

              <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#685773] sm:text-lg">
                Desde aquí podrás revisar las estadísticas, los avances y la
                actividad de los docentes.
              </p>

              <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/80 bg-white/70 px-5 py-3 text-sm font-semibold text-[#72567e] shadow-sm md:justify-start">
                <span className="text-xl">📅</span>
                <span>{fechaHora || "Cargando fecha y hora..."}</span>
              </div>

              <div className="mt-5 text-3xl font-bold text-purple-600">
                ━━━━━ ♥
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold tracking-widest text-[#b078b4]">
                RESUMEN GENERAL
              </p>
              <h3 className="mt-1 text-2xl font-black text-[#493254]">
                Estadísticas de docentes
              </h3>
              <p className="mt-1 text-sm text-[#887493]">
                Datos registrados en CAMPUS MR.
              </p>
            </div>

            <button
              onClick={cargarEstadisticas}
              disabled={cargandoEstadisticas}
              className="rounded-xl border border-purple-200 bg-white px-4 py-3 text-sm font-bold text-purple-700 shadow-sm transition hover:bg-purple-50 disabled:opacity-50"
            >
              {cargandoEstadisticas ? "Actualizando..." : "↻ Actualizar datos"}
            </button>
          </div>

          {errorEstadisticas && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <strong>No se pudieron cargar las estadísticas.</strong>
              <p className="mt-1 break-words">{errorEstadisticas}</p>
            </div>
          )}

          <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
            <div className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#987e9e]">Docentes</p>
              <p className="mt-2 text-3xl font-black text-[#573c65]">
                {docentes.length}
              </p>
              <p className="mt-1 text-xs text-[#ad9ab3]">
                Registrados en el campus
              </p>
            </div>

            <div className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#987e9e]">Grupos</p>
              <p className="mt-2 text-3xl font-black text-[#573c65]">
                {totales.grupos}
              </p>
              <p className="mt-1 text-xs text-[#ad9ab3]">Total registrados</p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#987e9e]">
                Estudiantes
              </p>
              <p className="mt-2 text-3xl font-black text-[#573c65]">
                {totales.estudiantes}
              </p>
              <p className="mt-1 text-xs text-[#ad9ab3]">Total registrados</p>
            </div>
          </div>

          <div className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5">
              <h4 className="text-xl font-black text-[#513b5d]">
                Resumen por docente
              </h4>
              <p className="mt-1 text-sm text-[#887493]">
                Selecciona un docente para consultar sus registros.
              </p>
            </div>

            <label
              htmlFor="seleccion-docente"
              className="mb-2 block text-sm font-bold text-[#72567e]"
            >
              Seleccionar docente
            </label>

            <select
              id="seleccion-docente"
              value={docenteSeleccionado}
              onChange={(event) =>
                setDocenteSeleccionado(event.target.value)
              }
              className="mb-6 w-full rounded-xl border border-purple-200 bg-[#fcf9ff] px-4 py-3 text-sm font-semibold text-[#513b5d] outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            >
              <option value="todos">Todos los docentes · Vista general</option>
              {docentes.map((docente) => (
                <option key={docente.id} value={docente.id}>
                  {docente.nombre || docente.correo}
                  {!docente.activo ? " (Inactivo)" : ""}
                </option>
              ))}
            </select>

            {docenteSeleccionado !== "todos" && !estadisticaActual ? (
              <p className="rounded-xl bg-purple-50 p-4 text-sm text-purple-700">
                No hay estadísticas disponibles para este docente.
              </p>
            ) : (
              <>
                {docenteActual && (
                  <div className="mb-5 rounded-2xl bg-[#f8f1fb] p-4">
                    <p className="font-extrabold text-[#573c65]">
                      {docenteActual.nombre || "Docente"}
                    </p>
                    <p className="mt-1 text-xs text-[#987e9e]">
                      {docenteActual.correo}
                    </p>
                  </div>
                )}

                <div className="space-y-5">
                  {AREAS.map((area) => {
                    const cantidad =
                      docenteSeleccionado === "todos"
                        ? totales[area.clave]
                        : estadisticaActual?.[area.clave] || 0;

                    const maximo =
                      docenteSeleccionado === "todos"
                        ? Math.max(
                            ...estadisticas.map(
                              (item) => item[area.clave]
                            ),
                            1
                          )
                        : Math.max(cantidad, 1);

                    const ancho = (cantidad / maximo) * 100;

                    return (
                      <div key={area.clave}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{area.icono}</span>
                            <span className="text-sm font-bold text-[#654d72]">
                              {area.nombre}
                            </span>
                          </div>

                          <span className="text-lg font-black text-[#573c65]">
                            {cantidad.toLocaleString("es-CR")}
                          </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-[#f0eaf4]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${ancho}%`,
                              backgroundColor: area.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {cargandoEstadisticas && (
              <p className="mt-5 text-center text-sm text-purple-600">
                Actualizando información...
              </p>
            )}

            {!cargandoEstadisticas &&
              docentes.length === 0 &&
              !errorEstadisticas && (
                <p className="mt-5 rounded-xl bg-purple-50 p-4 text-center text-sm text-purple-700">
                  Todavía no hay docentes registrados para mostrar.
                </p>
              )}
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-5">
            <p className="text-sm font-bold tracking-widest text-[#b078b4]">
              ORGANIZACIÓN EDUCATIVA
            </p>

            <h3 className="mt-1 text-2xl font-black text-[#493254]">
              Herramientas de asesoría
            </h3>

            <p className="mt-2 text-sm text-[#887493]">
              Espacios para organizar la supervisión y los informes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {[
              {
                icono: "📊",
                titulo: "Seguimiento",
                descripcion:
                  "Consulta estadísticas y avances de cada docente.",
                color: "bg-blue-100",
                fondo: "from-blue-50 to-white",
              },
              {
                icono: "👩‍🏫",
                titulo: "Acompañamiento docente",
                descripcion:
                  "Revisión y orientación de los procesos educativos.",
                color: "bg-purple-100",
                fondo: "from-purple-50 to-white",
              },
              {
                icono: "📋",
                titulo: "Informes",
                descripcion:
                  "Organización de reportes y documentación.",
                color: "bg-emerald-100",
                fondo: "from-emerald-50 to-white",
              },
              {
                icono: "📅",
                titulo: "Agenda de asesoría",
                descripcion:
                  "Planificación de revisiones y actividades.",
                color: "bg-amber-100",
                fondo: "from-amber-50 to-white",
              },
            ].map((item) => (
              <article
                key={item.titulo}
                className={`rounded-3xl border border-white bg-gradient-to-br ${item.fondo} p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${item.color} text-4xl shadow-sm`}
                >
                  {item.icono}
                </div>

                <h4 className="mt-6 text-xl font-black text-[#513b5d]">
                  {item.titulo}
                </h4>

                <p className="mt-2 text-sm leading-relaxed text-[#806e89]">
                  {item.descripcion}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-purple-100 bg-gradient-to-r from-[#f2e4fa] to-[#e9eaff] p-7 shadow-sm">
          <h3 className="text-xl font-black text-[#523c61]">
            💡 Supervisión educativa
          </h3>

          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-[#74617f]">
            Consulta de manera resumida la actividad registrada por los
            docentes en grupos, estudiantes, asistencias, calificaciones y
            bitácoras.
          </p>
        </section>

        <footer className="mt-9 pb-5 text-center text-xs text-[#a28eaa]">
          Material Didáctico MR · CAMPUS MR 2.0
        </footer>
      </section>
    </main>
  );
}
