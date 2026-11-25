
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Resumen = {
  usuarios: number;
  docentes: number;
  estudiantes: number;
  asesores: number;
  administradores: number;
  usuariosActivos: number;
  usuariosInactivos: number;
  modulos: number;
  videos: number;
  pdfs: number;
  recursos: number;
  preguntas: number;
  intentos: number;
};

const INICIAL: Resumen = {
  usuarios: 0,
  docentes: 0,
  estudiantes: 0,
  asesores: 0,
  administradores: 0,
  usuariosActivos: 0,
  usuariosInactivos: 0,
  modulos: 0,
  videos: 0,
  pdfs: 0,
  recursos: 0,
  preguntas: 0,
  intentos: 0,
};

const SECCIONES = [
  {
    titulo: "Usuarios",
    descripcion: "Administración de cuentas, perfiles y permisos.",
    detalle: "Consulta y controla los usuarios registrados en CAMPUS MR.",
    icono: "👥",
    ruta: "/admin/usuarios",
    color: "#3B82F6",
    etiqueta: "GESTIÓN DE CUENTAS",
  },
  {
    titulo: "Docentes",
    descripcion: "Registro, invitaciones y accesos docentes.",
    detalle: "Administra las cuentas de docentes y sus accesos.",
    icono: "👨‍🏫",
    ruta: "/admin/docentes",
    color: "#EC4899",
    etiqueta: "PERSONAL DOCENTE",
  },
  {
    titulo: "Módulos",
    descripcion: "Organización de módulos de estudio.",
    detalle: "Administra los módulos disponibles para los estudiantes.",
    icono: "📚",
    ruta: "/admin/modulos",
    color: "#8B5CF6",
    etiqueta: "CONTENIDO ACADÉMICO",
  },
  {
    titulo: "Videos",
    descripcion: "Biblioteca audiovisual educativa.",
    detalle: "Gestiona los videos que forman parte de los cursos.",
    icono: "🎥",
    ruta: "/admin/videos",
    color: "#EF4444",
    etiqueta: "BIBLIOTECA AUDIOVISUAL",
  },
  {
    titulo: "PDFs",
    descripcion: "Documentos y materiales descargables.",
    detalle: "Administra los documentos PDF de la plataforma.",
    icono: "📄",
    ruta: "/admin/pdfs",
    color: "#6366F1",
    etiqueta: "DOCUMENTOS",
  },
  {
    titulo: "Recursos",
    descripcion: "Material educativo complementario.",
    detalle: "Organiza y administra los recursos adicionales.",
    icono: "🗂️",
    ruta: "/admin/recursos",
    color: "#10B981",
    etiqueta: "RECURSOS EDUCATIVOS",
  },
  {
    titulo: "Biblioteca MR",
    descripcion: "Folletos y materiales educativos para docentes.",
    detalle: "Organiza materiales por nivel, grado, asignatura y servicio, de forma independiente del Curso de Idoneidad.",
    icono: "📚",
    ruta: "/admin/biblioteca",
    color: "#D946A6",
    etiqueta: "BIBLIOTECA EDUCATIVA MR",
  },
  {
    titulo: "Preguntas",
    descripcion: "Administración del banco de preguntas.",
    detalle: "Gestiona las preguntas utilizadas en las prácticas y evaluaciones.",
    icono: "📝",
    ruta: "/admin/preguntas",
    color: "#F97316",
    etiqueta: "EVALUACIÓN",
  },
  {
    titulo: "Estadísticas",
    descripcion: "Indicadores generales de CAMPUS MR.",
    detalle: "Consulta los datos y movimientos disponibles de la plataforma.",
    icono: "📊",
    ruta: "/admin/estadisticas",
    color: "#06B6D4",
    etiqueta: "ANÁLISIS DE DATOS",
  },
  {
    titulo: "Configuración",
    descripcion: "Control y ajustes de la plataforma.",
    detalle: "Administra las opciones generales del sistema.",
    icono: "⚙️",
    ruta: "/admin/configuracion",
    color: "#64748B",
    etiqueta: "SISTEMA",
  },
];

function formato(numero: number) {
  return numero.toLocaleString("es-CR");
}

export default function AdminPage() {
  const [datos, setDatos] = useState<Resumen>(INICIAL);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");

  async function cargarDatos() {
    setActualizando(true);
    setError("");

    try {
      const [
        usuarios,
        docentes,
        estudiantes,
        asesores,
        administradores,
        usuariosActivos,
        usuariosInactivos,
        modulos,
        videos,
        pdfs,
        recursos,
        preguntas,
        intentos,
      ] = await Promise.all([
        supabase.from("usuarios").select("*", { count: "exact", head: true }),
        supabase.from("usuarios").select("*", { count: "exact", head: true }).eq("rol", "docente"),
        supabase.from("usuarios").select("*", { count: "exact", head: true }).eq("rol", "estudiante"),
        supabase.from("usuarios").select("*", { count: "exact", head: true }).eq("rol", "asesora"),
        supabase.from("usuarios").select("*", { count: "exact", head: true }).eq("rol", "admin"),
        supabase.from("usuarios").select("*", { count: "exact", head: true }).eq("activo", true),
        supabase.from("usuarios").select("*", { count: "exact", head: true }).eq("activo", false),
        supabase.from("modulos").select("*", { count: "exact", head: true }),
        supabase.from("videos").select("*", { count: "exact", head: true }),
        supabase.from("pdfs").select("*", { count: "exact", head: true }),
        supabase.from("recursos").select("*", { count: "exact", head: true }),
        supabase.from("preguntas").select("*", { count: "exact", head: true }),
        supabase.from("intentos_examen").select("*", { count: "exact", head: true }),
      ]);

      const respuestas = [
        usuarios, docentes, estudiantes, asesores, administradores,
        usuariosActivos, usuariosInactivos, modulos, videos, pdfs,
        recursos, preguntas, intentos,
      ];

      const errores = respuestas
        .filter((respuesta) => respuesta.error)
        .map((respuesta) => respuesta.error?.message);

      if (errores.length > 0) {
        throw new Error(errores.join(" | "));
      }

      setDatos({
        usuarios: usuarios.count || 0,
        docentes: docentes.count || 0,
        estudiantes: estudiantes.count || 0,
        asesores: asesores.count || 0,
        administradores: administradores.count || 0,
        usuariosActivos: usuariosActivos.count || 0,
        usuariosInactivos: usuariosInactivos.count || 0,
        modulos: modulos.count || 0,
        videos: videos.count || 0,
        pdfs: pdfs.count || 0,
        recursos: recursos.count || 0,
        preguntas: preguntas.count || 0,
        intentos: intentos.count || 0,
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible consultar los datos."
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const totalMateriales = useMemo(
    () => datos.modulos + datos.videos + datos.pdfs + datos.recursos,
    [datos]
  );

  const indicadores = [
    {
      titulo: "Usuarios registrados",
      valor: datos.usuarios,
      detalle: "Todas las cuentas del sistema",
      icono: "👥",
      color: "from-blue-600 to-blue-800",
      fondo: "bg-blue-50",
      texto: "text-blue-700",
    },
    {
      titulo: "Docentes",
      valor: datos.docentes,
      detalle: "Cuentas con rol docente",
      icono: "👨‍🏫",
      color: "from-purple-600 to-purple-800",
      fondo: "bg-purple-50",
      texto: "text-purple-700",
    },
    {
      titulo: "Estudiantes",
      valor: datos.estudiantes,
      detalle: "Cuentas con rol estudiante",
      icono: "🎓",
      color: "from-cyan-600 to-cyan-800",
      fondo: "bg-cyan-50",
      texto: "text-cyan-700",
    },
    {
      titulo: "Materiales",
      valor: totalMateriales,
      detalle: "Módulos, videos, PDFs y recursos",
      icono: "📚",
      color: "from-emerald-600 to-emerald-800",
      fondo: "bg-emerald-50",
      texto: "text-emerald-700",
    },
  ];

  const distribucionUsuarios = [
    { nombre: "Docentes", valor: datos.docentes, color: "#8B5CF6" },
    { nombre: "Estudiantes", valor: datos.estudiantes, color: "#06B6D4" },
    { nombre: "Asesoras", valor: datos.asesores, color: "#EC4899" },
    { nombre: "Administradores", valor: datos.administradores, color: "#F59E0B" },
  ];

  const totalRoles = distribucionUsuarios.reduce(
    (total, item) => total + item.valor,
    0
  );

  const contenidos = [
    { nombre: "Módulos", valor: datos.modulos, icono: "📚", color: "#8B5CF6" },
    { nombre: "Videos", valor: datos.videos, icono: "🎥", color: "#EF4444" },
    { nombre: "PDFs", valor: datos.pdfs, icono: "📄", color: "#3B82F6" },
    { nombre: "Recursos", valor: datos.recursos, icono: "🗂️", color: "#10B981" },
  ];

  const totalContenidos = Math.max(totalMateriales, 1);

  return (
    <main className="min-h-screen space-y-8 bg-[#111827] p-4 text-white sm:p-6 lg:p-8">

      {/* CABECERA PRINCIPAL */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-700 bg-gradient-to-br from-[#172033] via-[#1e293b] to-[#0f172a] p-7 shadow-2xl sm:p-9">
        <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-xs font-bold tracking-widest text-blue-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              MR ACADEMY · CONTROL CENTER
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
              Panel de Administración
            </h1>

            <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
              Centro de control integral de Material Didáctico MR.
              Administra usuarios, contenidos, evaluaciones y el funcionamiento
              de CAMPUS MR 2.0 desde un solo lugar.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={cargarDatos}
              disabled={actualizando}
              className="rounded-xl border border-blue-400/40 bg-blue-500/15 px-5 py-3 text-sm font-bold text-blue-200 transition hover:bg-blue-500/30 disabled:opacity-50"
            >
              {actualizando ? "Actualizando..." : "↻ Actualizar datos"}
            </button>

            <Link
              href="/"
              className="rounded-xl border border-slate-600 bg-slate-800 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-slate-700"
            >
              Volver al Campus →
            </Link>
          </div>
        </div>

        <div className="relative mt-8 grid gap-3 border-t border-slate-700 pt-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Plataforma
            </p>
            <p className="mt-1 font-bold text-slate-100">CAMPUS MR 2.0</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Centro de gestión
            </p>
            <p className="mt-1 font-bold text-slate-100">Administración general</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Fuente de información
            </p>
            <p className="mt-1 font-bold text-emerald-400">Supabase</p>
          </div>
        </div>
      </section>

      {/* MENSAJE DE ERROR */}
      {error && (
        <section className="rounded-2xl border border-red-500/30 bg-red-950/40 p-5 text-sm text-red-200">
          <strong className="block text-base">No se pudieron cargar algunos datos.</strong>
          <p className="mt-2 break-words">{error}</p>
          <p className="mt-2 text-red-300/80">
            Revisa los permisos de lectura de las tablas indicadas.
          </p>
        </section>
      )}

      {/* INDICADORES PRINCIPALES */}
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-blue-400">
              VISIÓN GENERAL
            </p>
            <h2 className="mt-2 text-2xl font-black">Indicadores principales</h2>
            <p className="mt-1 text-sm text-slate-400">
              Resumen de los datos registrados en la plataforma.
            </p>
          </div>

          <span className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-400">
            {cargando ? "Consultando..." : "Información consultada"}
          </span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {indicadores.map((item) => (
            <article
              key={item.titulo}
              className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-[#1F2937] p-5 shadow-lg transition duration-300 hover:-translate-y-1 hover:border-slate-500 hover:shadow-2xl"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.color}`} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-400">
                    {item.titulo}
                  </p>
                  <p className="mt-4 text-4xl font-black tracking-tight text-white">
                    {cargando ? "..." : formato(item.valor)}
                  </p>
                </div>

                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.fondo} text-3xl transition group-hover:scale-110`}>
                  {item.icono}
                </div>
              </div>
              <p className="mt-4 border-t border-slate-700 pt-3 text-xs text-slate-500">
                {item.detalle}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* GRÁFICOS */}
      <section>
        <div className="mb-5">
          <p className="text-xs font-bold tracking-[0.2em] text-blue-400">
            ANÁLISIS DE PLATAFORMA
          </p>
          <h2 className="mt-2 text-2xl font-black">Panel de estadísticas</h2>
          <p className="mt-1 text-sm text-slate-400">
            Distribución de usuarios y contenidos registrados.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">

          {/* DISTRIBUCIÓN DE USUARIOS */}
          <article className="rounded-2xl border border-slate-700 bg-[#1F2937] p-6 shadow-lg">
            <div className="mb-6">
              <p className="text-xs font-bold tracking-widest text-blue-400">
                COMPOSICIÓN DE CUENTAS
              </p>
              <h3 className="mt-2 text-xl font-black">Usuarios por rol</h3>
              <p className="mt-1 text-xs text-slate-500">
                Distribución de las cuentas según su tipo de acceso.
              </p>
            </div>

            <div className="flex flex-col items-center gap-7 sm:flex-row">
              <div
                className="relative flex h-48 w-48 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${distribucionUsuarios.map((item, index) => {
                    const anterior = distribucionUsuarios
                      .slice(0, index)
                      .reduce((sum, dato) => sum + dato.valor, 0);
                    const inicio = totalRoles ? (anterior / totalRoles) * 100 : 0;
                    const fin = totalRoles ? ((anterior + item.valor) / totalRoles) * 100 : 0;
                    return `${item.color} ${inicio}% ${fin}%`;
                  }).join(", ")}, #374151 0% 100%)`,
                }}
              >
                <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-[#1F2937]">
                  <span className="text-3xl font-black">
                    {cargando ? "..." : formato(totalRoles)}
                  </span>
                  <span className="mt-1 text-xs text-slate-400">Cuentas</span>
                </div>
              </div>

              <div className="w-full space-y-4">
                {distribucionUsuarios.map((item) => (
                  <div key={item.nombre}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-slate-300">
                          {item.nombre}
                        </span>
                      </div>
                      <span className="font-bold text-white">
                        {formato(item.valor)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${totalRoles ? (item.valor / totalRoles) * 100 : 0}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>

          {/* DISTRIBUCIÓN DE CONTENIDOS */}
          <article className="rounded-2xl border border-slate-700 bg-[#1F2937] p-6 shadow-lg">
            <div className="mb-6">
              <p className="text-xs font-bold tracking-widest text-emerald-400">
                BIBLIOTECA DIGITAL
              </p>
              <h3 className="mt-2 text-xl font-black">Contenidos registrados</h3>
              <p className="mt-1 text-xs text-slate-500">
                Comparación de materiales disponibles en el sistema.
              </p>
            </div>

            <div className="mb-6 flex items-center justify-between rounded-xl bg-slate-800 p-4">
              <div>
                <p className="text-xs text-slate-400">Total de materiales</p>
                <p className="mt-1 text-3xl font-black text-white">
                  {cargando ? "..." : formato(totalMateriales)}
                </p>
              </div>
              <div className="text-4xl">📚</div>
            </div>

            <div className="space-y-5">
              {contenidos.map((item) => (
                <div key={item.nombre}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.icono}</span>
                      <span className="text-sm text-slate-300">
                        {item.nombre}
                      </span>
                    </div>
                    <span className="font-bold text-white">
                      {formato(item.valor)}
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(item.valor / totalContenidos) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      {/* ESTADO DE CUENTAS Y EVALUACIONES */}
      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-700 bg-[#1F2937] p-6 shadow-lg">
          <p className="text-xs font-bold tracking-widest text-amber-400">
            CONTROL DE ACCESOS
          </p>
          <h3 className="mt-2 text-xl font-black">Estado de las cuentas</h3>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5">
              <p className="text-xs font-semibold text-emerald-300">Activas</p>
              <p className="mt-2 text-3xl font-black text-white">
                {cargando ? "..." : formato(datos.usuariosActivos)}
              </p>
            </div>

            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5">
              <p className="text-xs font-semibold text-red-300">Inactivas</p>
              <p className="mt-2 text-3xl font-black text-white">
                {cargando ? "..." : formato(datos.usuariosInactivos)}
              </p>
            </div>
          </div>

          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-slate-700">
            <div
              className="bg-emerald-500 transition-all duration-700"
              style={{
                width: `${datos.usuarios ? (datos.usuariosActivos / datos.usuarios) * 100 : 0}%`,
              }}
            />
            <div
              className="bg-red-500 transition-all duration-700"
              style={{
                width: `${datos.usuarios ? (datos.usuariosInactivos / datos.usuarios) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Distribución de cuentas activas e inactivas.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-700 bg-[#1F2937] p-6 shadow-lg">
          <p className="text-xs font-bold tracking-widest text-orange-400">
            ACTIVIDAD EVALUATIVA
          </p>
          <h3 className="mt-2 text-xl font-black">Banco de preguntas y exámenes</h3>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-orange-500/10 p-5">
              <p className="text-xs font-semibold text-orange-300">
                Preguntas
              </p>
              <p className="mt-2 text-3xl font-black text-white">
                {cargando ? "..." : formato(datos.preguntas)}
              </p>
            </div>

            <div className="rounded-xl bg-blue-500/10 p-5">
              <p className="text-xs font-semibold text-blue-300">
                Intentos registrados
              </p>
              <p className="mt-2 text-3xl font-black text-white">
                {cargando ? "..." : formato(datos.intentos)}
              </p>
            </div>
          </div>

          <p className="mt-5 text-xs leading-relaxed text-slate-500">
            Conteos generales del banco de preguntas y de la tabla de intentos
            de examen. No representan calificaciones ni resultados de aprobación.
          </p>
        </article>
      </section>

      {/* ACCESOS ADMINISTRATIVOS */}
      <section>
        <div className="mb-5">
          <p className="text-xs font-bold tracking-[0.2em] text-blue-400">
            CENTRO DE OPERACIONES
          </p>
          <h2 className="mt-2 text-2xl font-black">
            Administración de la plataforma
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Accede directamente a cada área de gestión.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {SECCIONES.map((item) => (
            <Link
              key={item.ruta}
              href={item.ruta}
              className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-[#1F2937] p-6 shadow-lg transition duration-300 hover:-translate-y-1 hover:border-slate-500 hover:bg-[#273449] hover:shadow-2xl"
            >
              <div
                className="absolute left-0 top-0 h-1 w-full transition-all duration-300 group-hover:h-1.5"
                style={{ backgroundColor: item.color }}
              />

              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-4xl shadow-lg transition duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: `${item.color}20`,
                  }}
                >
                  {item.icono}
                </div>

                <span className="rounded-full border border-slate-600 px-3 py-1 text-[9px] font-bold tracking-wider text-slate-400">
                  {item.etiqueta}
                </span>
              </div>

              <h3 className="mt-6 text-xl font-black text-white transition group-hover:text-blue-300">
                {item.titulo}
              </h3>

              <p className="mt-2 text-sm font-semibold text-slate-300">
                {item.descripcion}
              </p>

              <p className="mt-3 min-h-10 text-xs leading-relaxed text-slate-500">
                {item.detalle}
              </p>

              <div className="mt-5 flex items-center justify-between border-t border-slate-700 pt-4">
                <span className="text-xs font-bold text-blue-400">
                  Abrir sección
                </span>
                <span className="text-lg text-slate-500 transition group-hover:translate-x-1 group-hover:text-blue-300">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* PIE */}
      <footer className="rounded-2xl border border-slate-700 bg-[#1F2937] p-6 text-center shadow-lg">
        <p className="font-black tracking-wide text-white">
          MATERIAL DIDÁCTICO MR
        </p>
        <p className="mt-1 text-xs text-slate-500">
          MR ACADEMY · CAMPUS MR 2.0 · CENTRO DE ADMINISTRACIÓN
        </p>
      </footer>
    </main>
  );
}
