
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, UsuarioActual } from "@/lib/auth";

interface Actividad {
  id: string;
  docente_id: string;
  titulo: string;
  descripcion: string | null;
  tipo: string;
  fecha: string;
  hora: string | null;
  created_at: string;
}

const TIPOS = [
  "Actividad",
  "Reunión",
  "Evaluación",
  "Entrega",
  "Recordatorio",
  "Acto cívico",
  "Otro",
];

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril",
  "Mayo", "Junio", "Julio", "Agosto",
  "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function fechaLocal(fecha: Date) {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${año}-${mes}-${dia}`;
}

function colorTipo(tipo: string) {
  switch (tipo) {
    case "Reunión":
      return "bg-purple-100 text-purple-800";
    case "Evaluación":
      return "bg-amber-100 text-amber-800";
    case "Entrega":
      return "bg-blue-100 text-blue-800";
    case "Recordatorio":
      return "bg-pink-100 text-pink-800";
    case "Acto cívico":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function CalendarioDocentePage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoActividades, setCargandoActividades] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const hoy = new Date();

  const [mesActual, setMesActual] = useState(
    new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  );

  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    fechaLocal(hoy)
  );

  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("Actividad");
  const [fecha, setFecha] = useState(fechaLocal(hoy));
  const [hora, setHora] = useState("");

  // Verificar usuario y permisos
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
      setCargando(false);
    }

    iniciar();

    return () => {
      activo = false;
    };
  }, [router]);

  // Cargar actividades del mes seleccionado
  useEffect(() => {
    if (!usuario) return;

    // Guardamos el ID en una constante para que TypeScript confirme
    // que existe dentro de la función asíncrona.
    const docenteId = usuario.id;

    let activo = true;

    async function cargarActividades() {
      setCargandoActividades(true);
      setError("");

      const inicio = fechaLocal(
        new Date(mesActual.getFullYear(), mesActual.getMonth(), 1)
      );

      const siguienteMes = fechaLocal(
        new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1)
      );

      const { data, error } = await supabase
        .from("agenda_docente")
        .select("*")
        .eq("docente_id", docenteId)
        .gte("fecha", inicio)
        .lt("fecha", siguienteMes)
        .order("fecha", { ascending: true })
        .order("hora", { ascending: true });

      if (!activo) return;

      if (error) {
        setError("No se pudieron cargar las actividades: " + error.message);
      } else {
        setActividades((data || []) as Actividad[]);
      }

      setCargandoActividades(false);
    }

    cargarActividades();

    return () => {
      activo = false;
    };
  }, [usuario, mesActual]);

  // Construir los días del calendario
  const primerDia = new Date(
    mesActual.getFullYear(),
    mesActual.getMonth(),
    1
  );

  const ultimoDia = new Date(
    mesActual.getFullYear(),
    mesActual.getMonth() + 1,
    0
  );

  const espaciosIniciales = (primerDia.getDay() + 6) % 7;
  const totalDias = ultimoDia.getDate();

  const diasCalendario = [
    ...Array(espaciosIniciales).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];

  while (diasCalendario.length % 7 !== 0) {
    diasCalendario.push(null);
  }

  const actividadesDelDia = actividades.filter(
    (actividad) => actividad.fecha === fechaSeleccionada
  );

  function cambiarMes(cantidad: number) {
    setMesActual(
      new Date(
        mesActual.getFullYear(),
        mesActual.getMonth() + cantidad,
        1
      )
    );
  }

  function seleccionarDia(dia: number) {
    const nuevaFecha = fechaLocal(
      new Date(mesActual.getFullYear(), mesActual.getMonth(), dia)
    );

    setFechaSeleccionada(nuevaFecha);
    setFecha(nuevaFecha);
    setMensaje("");
    setError("");
  }

  async function registrarActividad(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!usuario) return;

    if (!titulo.trim()) {
      setError("Escribí el título de la actividad.");
      return;
    }

    setGuardando(true);
    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("agenda_docente")
      .insert({
        docente_id: usuario.id,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        tipo,
        fecha,
        hora: hora || null,
      });

    setGuardando(false);

    if (error) {
      setError("No se pudo guardar la actividad: " + error.message);
      return;
    }

    setTitulo("");
    setDescripcion("");
    setTipo("Actividad");
    setHora("");

    setFechaSeleccionada(fecha);
    setMesActual(
      new Date(
        Number(fecha.substring(0, 4)),
        Number(fecha.substring(5, 7)) - 1,
        1
      )
    );

    setMostrarFormulario(false);
    setMensaje("¡Actividad registrada correctamente!");
  }

  async function eliminarActividad(id: string) {
    if (!usuario) return;

    const confirmar = window.confirm(
      "¿Deseás eliminar esta actividad de tu agenda?"
    );

    if (!confirmar) return;

    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("agenda_docente")
      .delete()
      .eq("id", id)
      .eq("docente_id", usuario.id);

    if (error) {
      setError("No se pudo eliminar la actividad: " + error.message);
      return;
    }

    setActividades((actuales) =>
      actuales.filter((actividad) => actividad.id !== id)
    );

    setMensaje("Actividad eliminada correctamente.");
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FFF9FC]">
        <p className="text-lg font-semibold text-slate-600">
          Cargando tu agenda docente...
        </p>
      </main>
    );
  }

  if (!usuario) return null;

  return (
    <main className="min-h-screen bg-[#FFF9FC] p-4 text-[#49375E] sm:p-8">
      <div className="mx-auto max-w-7xl">

        {/* ENCABEZADO */}
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-purple-700 hover:underline"
            >
              ← Volver al panel principal
            </Link>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F7DCEC] to-[#E9DDFC] text-3xl shadow-sm">
                📅
              </div>

              <div>
                <h1 className="text-3xl font-extrabold">
                  Agenda Docente MR
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Organizá tus actividades y compromisos escolares.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#F0DCEB] bg-white px-5 py-3 shadow-sm">
            <p className="text-xs text-slate-500">Docente</p>
            <p className="font-bold">{usuario.nombre}</p>
          </div>
        </header>

        {/* MENSAJES */}
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

        {/* RESUMEN */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-pink-100 bg-[#FCEAF2] p-5">
            <p className="text-sm font-semibold text-slate-600">
              Actividades del mes
            </p>
            <p className="mt-2 text-3xl font-extrabold">
              {actividades.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Registros en tu agenda
            </p>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-[#F0E9FC] p-5">
            <p className="text-sm font-semibold text-slate-600">
              Actividades del día
            </p>
            <p className="mt-2 text-3xl font-extrabold">
              {actividadesDelDia.length}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Para la fecha seleccionada
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-[#E5F6EF] p-5">
            <p className="text-sm font-semibold text-slate-600">
              Mes de consulta
            </p>
            <p className="mt-2 text-2xl font-extrabold">
              {MESES[mesActual.getMonth()]}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {mesActual.getFullYear()}
            </p>
          </div>
        </div>

        {/* CALENDARIO Y ACTIVIDADES */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.9fr]">

          {/* CALENDARIO */}
          <section className="rounded-3xl border border-[#F0DCEB] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold">
                  {MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Seleccioná un día para consultar tus actividades.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => cambiarMes(-1)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold hover:bg-purple-50"
                  aria-label="Mes anterior"
                >
                  ←
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const ahora = new Date();
                    setMesActual(
                      new Date(ahora.getFullYear(), ahora.getMonth(), 1)
                    );
                    setFechaSeleccionada(fechaLocal(ahora));
                    setFecha(fechaLocal(ahora));
                  }}
                  className="rounded-xl bg-[#F3E8F5] px-4 py-2 text-sm font-bold text-purple-800 hover:bg-purple-100"
                >
                  Hoy
                </button>

                <button
                  type="button"
                  onClick={() => cambiarMes(1)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold hover:bg-purple-50"
                  aria-label="Mes siguiente"
                >
                  →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {DIAS.map((dia) => (
                <div
                  key={dia}
                  className="py-3 text-center text-xs font-extrabold text-slate-500 sm:text-sm"
                >
                  {dia}
                </div>
              ))}

              {diasCalendario.map((dia, indice) => {
                if (dia === null) {
                  return (
                    <div
                      key={`vacio-${indice}`}
                      className="min-h-[66px] rounded-xl bg-slate-50/60 sm:min-h-[90px]"
                    />
                  );
                }

                const fechaDia = fechaLocal(
                  new Date(
                    mesActual.getFullYear(),
                    mesActual.getMonth(),
                    dia
                  )
                );

                const cantidad = actividades.filter(
                  (actividad) => actividad.fecha === fechaDia
                ).length;

                const seleccionado = fechaDia === fechaSeleccionada;
                const esHoy = fechaDia === fechaLocal(new Date());

                return (
                  <button
                    key={fechaDia}
                    type="button"
                    onClick={() => seleccionarDia(dia)}
                    className={`flex min-h-[66px] flex-col items-center justify-center rounded-xl border p-1 transition sm:min-h-[90px] ${
                      seleccionado
                        ? "border-purple-400 bg-gradient-to-br from-[#F5DFF0] to-[#EDE4FA] shadow-sm"
                        : "border-transparent bg-slate-50 hover:border-pink-200 hover:bg-pink-50"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold sm:h-9 sm:w-9 sm:text-base ${
                        esHoy
                          ? "bg-[#D45C9C] text-white"
                          : "text-slate-700"
                      }`}
                    >
                      {dia}
                    </span>

                    {cantidad > 0 && (
                      <span className="mt-1 rounded-full bg-purple-600 px-2 py-0.5 text-[9px] font-bold text-white sm:text-xs">
                        {cantidad} {cantidad === 1 ? "actividad" : "act."}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#D45C9C]" />
                Día actual
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-purple-300" />
                Día seleccionado
              </span>
              <span>Los puntos indican actividades registradas.</span>
            </div>
          </section>

          {/* PANEL DE ACTIVIDADES */}
          <section className="rounded-3xl border border-[#F0DCEB] bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold">
                  Mis actividades
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {new Date(
                    Number(fechaSeleccionada.substring(0, 4)),
                    Number(fechaSeleccionada.substring(5, 7)) - 1,
                    Number(fechaSeleccionada.substring(8, 10))
                  ).toLocaleDateString("es-CR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFecha(fechaSeleccionada);
                  setMostrarFormulario(!mostrarFormulario);
                  setError("");
                  setMensaje("");
                }}
                className="rounded-xl bg-gradient-to-r from-[#A95AC0] to-[#D45C9C] px-4 py-3 text-sm font-bold text-white shadow-sm hover:opacity-90"
              >
                {mostrarFormulario ? "Cerrar" : "+ Nueva actividad"}
              </button>
            </div>

            {mostrarFormulario && (
              <form
                onSubmit={registrarActividad}
                className="mb-6 space-y-4 rounded-2xl border border-pink-100 bg-[#FFF8FC] p-4"
              >
                <h3 className="font-extrabold">
                  Registrar actividad
                </h3>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Título *
                  </label>
                  <input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                    maxLength={150}
                    placeholder="Ej. Reunión de padres"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Tipo de actividad
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-purple-400"
                  >
                    {TIPOS.map((opcion) => (
                      <option key={opcion} value={opcion}>
                        {opcion}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Hora
                    </label>
                    <input
                      type="time"
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="Agregá detalles o información importante..."
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-purple-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full rounded-xl bg-purple-700 px-5 py-3 font-bold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {guardando ? "Guardando..." : "Guardar en mi agenda"}
                </button>
              </form>
            )}

            {cargandoActividades ? (
              <p className="py-10 text-center text-sm text-slate-500">
                Cargando actividades...
              </p>
            ) : actividadesDelDia.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                <span className="text-5xl">🌷</span>
                <h3 className="mt-3 font-bold">
                  No hay actividades para este día
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Podés agregar una actividad, reunión o recordatorio.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {actividadesDelDia.map((actividad) => (
                  <article
                    key={actividad.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${colorTipo(
                            actividad.tipo
                          )}`}
                        >
                          {actividad.tipo}
                        </span>

                        <h3 className="mt-2 break-words font-extrabold">
                          {actividad.titulo}
                        </h3>

                        {actividad.hora && (
                          <p className="mt-1 text-sm font-semibold text-purple-700">
                            🕒 {actividad.hora.substring(0, 5)}
                          </p>
                        )}

                        {actividad.descripcion && (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                            {actividad.descripcion}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => eliminarActividad(actividad.id)}
                        className="shrink-0 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
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

        <div className="mt-6 rounded-2xl border border-purple-100 bg-gradient-to-r from-[#F8E8F3] to-[#EEE9FA] p-5">
          <p className="font-bold">💡 Organiza tu trabajo docente</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Registrá reuniones, evaluaciones, actividades escolares,
            entregas y recordatorios. Tus registros se guardan en tu
            cuenta de CAMPUS MR.
          </p>
        </div>

      </div>
    </main>
  );
}
