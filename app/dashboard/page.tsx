"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, UsuarioActual } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const AVATARES: Record<string, string> = {
  "maestra-morena": "/avatares/maestra-morena.png",
  "maestra-clara": "/avatares/maestra-clara.png",
  "maestro-lentes": "/avatares/maestro-lentes.png",
  "maestro-barba": "/avatares/maestro-barba.png",
};

type ActividadAgenda = {
  id: string;
  titulo: string;
  tipo: string;
  fecha: string;
  hora: string | null;
  descripcion: string | null;
};

type GrupoDocente = {
  id: string;
  nombre: string;
  nivel: string | null;
  seccion: string | null;
  curso_lectivo: number;
  descripcion?: string | null;
};

function obtenerFechaLocal() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function formatearFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-CR", {
    day: "numeric",
    month: "short",
  });
}

function DashboardDocente({ usuario }: { usuario: UsuarioActual }) {
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [cargandoAvatar, setCargandoAvatar] = useState(true);
  const [proximasActividades, setProximasActividades] = useState<ActividadAgenda[]>([]);
  const [totalActividades, setTotalActividades] = useState(0);
  const [cargandoActividades, setCargandoActividades] = useState(true);
  const [gruposDocente, setGruposDocente] = useState<GrupoDocente[]>([]);
  const [totalGrupos, setTotalGrupos] = useState(0);
  const [totalEstudiantes, setTotalEstudiantes] = useState(0);
  const [promedioGeneral, setPromedioGeneral] = useState<number | null>(null);
  const [cargandoRegistros, setCargandoRegistros] = useState(true);

  useEffect(() => {
    let activo = true;

    async function cargarAvatar() {
      const { data, error } = await supabase
        .from("usuarios")
        .select("avatar_tipo, avatar_seleccionado")
        .eq("id", usuario.id)
        .single();

      if (error || !data) {
        if (activo) setCargandoAvatar(false);
        return;
      }

      let imagen = "";
      if (data.avatar_tipo === "predeterminado" || !data.avatar_tipo) {
        imagen = AVATARES[data.avatar_seleccionado] || AVATARES["maestra-morena"];
      } else if (data.avatar_seleccionado) {
        const { data: archivo, error: errorUrl } = await supabase.storage
          .from("avatares")
          .createSignedUrl(data.avatar_seleccionado, 3600);
        if (!errorUrl && archivo?.signedUrl) imagen = archivo.signedUrl;
      }

      if (activo) {
        setAvatarUrl(imagen);
        setCargandoAvatar(false);
      }
    }

    cargarAvatar();
    return () => { activo = false; };
  }, [usuario.id]);

  useEffect(() => {
    let activo = true;

    async function cargarRegistrosDocente() {
      setCargandoRegistros(true);

      const [resultadoGrupos, resultadoConteoGrupos, resultadoConteoEstudiantes, resultadoCalificaciones] =
        await Promise.all([
          supabase
            .from("grupos")
            .select("id, nombre, nivel, seccion, curso_lectivo, descripcion")
            .eq("docente_id", usuario.id)
            .order("nombre", { ascending: true })
            .limit(4),
          supabase
            .from("grupos")
            .select("id", { count: "exact", head: true })
            .eq("docente_id", usuario.id),
          supabase
            .from("estudiantes")
            .select("id", { count: "exact", head: true })
            .eq("docente_id", usuario.id),
          supabase
            .from("calificaciones")
            .select("nota")
            .eq("docente_id", usuario.id),
        ]);

      if (!activo) return;

      if (resultadoGrupos.error) {
        console.error("Error al cargar grupos del docente:", resultadoGrupos.error);
        setGruposDocente([]);
      } else {
        setGruposDocente((resultadoGrupos.data ?? []) as GrupoDocente[]);
      }

      if (resultadoConteoGrupos.error) {
        console.error("Error al contar grupos:", resultadoConteoGrupos.error);
        setTotalGrupos(0);
      } else {
        setTotalGrupos(resultadoConteoGrupos.count ?? 0);
      }

      if (resultadoConteoEstudiantes.error) {
        console.error("Error al contar estudiantes:", resultadoConteoEstudiantes.error);
        setTotalEstudiantes(0);
      } else {
        setTotalEstudiantes(resultadoConteoEstudiantes.count ?? 0);
      }

      if (resultadoCalificaciones.error) {
        console.error("Error al cargar calificaciones para el promedio:", resultadoCalificaciones.error);
        setPromedioGeneral(null);
      } else {
        const notas = (resultadoCalificaciones.data ?? [])
          .map((registro) => Number(registro.nota))
          .filter((nota) => Number.isFinite(nota));
        const promedio = notas.length > 0
          ? notas.reduce((suma, nota) => suma + nota, 0) / notas.length
          : null;
        setPromedioGeneral(promedio);
      }

      setCargandoRegistros(false);
    }

    cargarRegistrosDocente();
    return () => { activo = false; };
  }, [usuario.id]);

  useEffect(() => {
    let activo = true;

    async function cargarProximasActividades() {
      setCargandoActividades(true);

      const [{ data, error }, { count, error: errorConteo }] = await Promise.all([
        supabase
          .from("agenda_docente")
          .select("id, titulo, tipo, fecha, hora, descripcion")
          .eq("docente_id", usuario.id)
          .gte("fecha", obtenerFechaLocal())
          .order("fecha", { ascending: true })
          .order("hora", { ascending: true })
          .limit(3),
        supabase
          .from("agenda_docente")
          .select("id", { count: "exact", head: true })
          .eq("docente_id", usuario.id),
      ]);

      if (!activo) return;
      if (error) {
        console.error("Error al cargar próximas actividades:", error);
        setProximasActividades([]);
      } else {
        setProximasActividades((data ?? []) as ActividadAgenda[]);
      }
      if (errorConteo) {
        console.error("Error al contar actividades:", errorConteo);
        setTotalActividades(0);
      } else {
        setTotalActividades(count ?? 0);
      }
      setCargandoActividades(false);
    }

    cargarProximasActividades();
    return () => { activo = false; };
  }, [usuario.id]);

  const menu = [
    { icono: "🏠", nombre: "Inicio", href: "/dashboard" },
    { icono: "👥", nombre: "Mis grupos", href: "/docente/grupos" },
    { icono: "🧑‍🎓", nombre: "Estudiantes", href: "/docente/estudiantes" },
    { icono: "☑️", nombre: "Asistencia", href: "/docente/asistencia" },
    { icono: "📝", nombre: "Calificaciones", href: "/docente/calificaciones" },
    { icono: "📋", nombre: "Bitácora", href: "/docente/bitacora" },
    { icono: "📅", nombre: "Calendario", href: "/docente/calendario" },
    { icono: "📚", nombre: "Materiales", href: "/docente/materiales" },
    { icono: "🔔", nombre: "Novedades", href: "/docente/novedades" },
    { icono: "⚙️", nombre: "Configuración", href: "/docente/configuracion" },
    { icono: "❔", nombre: "Ayuda", href: "/docente/ayuda" },
  ];

  const indicadores = [
    {
      icono: "👥", titulo: "Mis grupos", valor: cargandoRegistros ? "…" : String(totalGrupos),
      detalle: "Grupos registrados", color: "bg-[#FCEAF2]", iconColor: "bg-[#D45C9C]",
      href: "/docente/grupos",
    },
    {
      icono: "👤", titulo: "Estudiantes", valor: cargandoRegistros ? "…" : String(totalEstudiantes),
      detalle: "Estudiantes registrados", color: "bg-[#E5F6EF]", iconColor: "bg-[#69B99A]",
      href: "/docente/estudiantes",
    },
    {
      icono: "☑️", titulo: "Actividades", valor: String(totalActividades),
      detalle: "Actividades registradas", color: "bg-[#F0E9FC]", iconColor: "bg-[#A96BC4]",
      href: "/docente/calendario",
    },
    {
      icono: "⭐", titulo: "Promedio general", valor: cargandoRegistros ? "…" : promedioGeneral === null ? "—" : promedioGeneral.toFixed(2),
      detalle: promedioGeneral === null ? "Sin calificaciones" : "Promedio de notas registradas", color: "bg-[#FFF4D9]", iconColor: "bg-[#E7AD45]",
      href: "/docente/calificaciones",
    },
  ];

  return (
    <main className="min-h-screen bg-[#FFF9FC] text-[#49375E] lg:flex">
      <aside className="w-full shrink-0 border-b border-[#F0DCEB] bg-gradient-to-b from-[#F8E4F0] via-[#F5EAF8] to-[#EEE8FC] px-4 py-5 text-[#59436D] shadow-sm lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[226px] lg:flex-col lg:overflow-y-auto">
        <div className="mb-7 text-center">
          <img src="/logo-material-didactico-mr.png" alt="Logo Material Didáctico MR" className="mx-auto h-20 w-20 rounded-2xl bg-white object-contain p-2 shadow-sm" />
          <h1 className="mt-3 text-2xl font-extrabold leading-tight text-[#49375E]">CAMPUS <span className="text-[#D45C9C]">MR 2.0</span></h1>
          <p className="mt-2 text-xs font-semibold tracking-[0.2em] text-[#A477A5]">ESPACIO DOCENTE</p>
        </div>

        <nav className="grid grid-cols-2 gap-2 lg:flex lg:flex-col">
          {menu.map((item, index) => (
            <Link key={item.nombre} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${index === 0 ? "bg-gradient-to-r from-[#B66AC5] to-[#D45C9C] text-white shadow-md shadow-[#D8B6DF]/40" : "text-[#765D83] hover:bg-white/75 hover:text-[#A34F91]"}`}>
              <span className="text-xl">{item.icono}</span>{item.nombre}
            </Link>
          ))}
        </nav>

        <div className="mt-6 rounded-2xl border border-white/80 bg-gradient-to-br from-[#E8D9F7] to-[#F8DDEB] p-4 text-center shadow-lg lg:mt-auto">
          <div className="text-3xl">👑</div>
          <h3 className="mt-2 font-bold">Miembro MR</h3>
          <p className="mt-2 text-xs leading-relaxed text-[#806C8C]">Acceso a herramientas y novedades de Material Didáctico MR.</p>
          <Link href="/biblioteca" className="mt-3 block w-full rounded-full bg-gradient-to-r from-[#A95AC0] to-[#D45C9C] px-3 py-2 text-sm font-bold text-white shadow-sm">Ver materiales</Link>
        </div>
      </aside>

      <section className="min-w-0 flex-1 p-4 sm:p-6 lg:ml-[226px] lg:p-7">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm text-slate-500">Panel de control</p><h2 className="text-xl font-extrabold">Mi espacio docente</h2></div>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Notificaciones" className="relative rounded-full border border-[#F0DCEB] bg-white p-3 shadow-sm"><span className="text-xl">🔔</span><span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">0</span></button>
            <Link href="/perfil" className="flex items-center gap-2 rounded-full border border-[#F0DCEB] bg-white p-2 shadow-sm">
              {avatarUrl ? <img src={avatarUrl} alt="Avatar del docente" className="h-11 w-11 rounded-full border-2 border-[#E8CBE0] object-cover" /> : <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F3E4F2] font-bold text-[#A45B91]">{cargandoAvatar ? "…" : "👤"}</div>}
              <span className="max-w-[150px] truncate text-sm font-semibold">{usuario.nombre}</span><span className="px-2">⌄</span>
            </Link>
          </div>
        </header>

        <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="flex min-h-[205px] items-center gap-5 overflow-hidden rounded-3xl border border-white bg-gradient-to-r from-[#F8E2F1] to-[#EDE5FA] p-5 shadow-sm sm:p-7">
            {avatarUrl ? <img src={avatarUrl} alt={`Avatar de ${usuario.nombre}`} className="hidden h-36 w-36 shrink-0 rounded-full border-4 border-white object-cover shadow-lg sm:block" /> : <div className="hidden h-36 w-36 shrink-0 items-center justify-center rounded-full bg-white text-6xl shadow-lg sm:flex">👩‍🏫</div>}
            <div><p className="text-sm font-semibold text-[#A45B91]">BIENVENIDO/A A CAMPUS MR 2.0</p><h2 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">¡Hola, Profe {usuario.nombre}!</h2><p className="mt-3 text-base text-slate-700 sm:text-lg">Sigamos construyendo aprendizajes increíbles.</p><div className="mt-3 text-2xl text-purple-600">━━━━━ ♥</div></div>
          </div>
          <div className="relative flex min-h-[205px] flex-col justify-center overflow-hidden rounded-3xl border border-[#F2DCEB] bg-gradient-to-br from-[#FFF1F7] to-[#F1EAFE] p-6 shadow-sm">
            <span className="absolute right-5 top-4 rounded-full bg-[#D45C9C] px-3 py-1 text-xs font-bold text-white">Novedades</span><span className="text-3xl">📣</span><h3 className="mt-2 text-xl font-extrabold">¡Novedades en Tienda MR!</h3><p className="mt-2 text-sm leading-relaxed text-slate-700">Descubre nuevos materiales educativos de Material Didáctico MR.</p>
            <Link href="/biblioteca" className="mt-4 w-fit rounded-xl bg-gradient-to-r from-[#A95AC0] to-[#D45C9C] px-5 py-3 text-sm font-bold text-white shadow-sm">Ver materiales →</Link>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {indicadores.map((item) => (
            <Link key={item.titulo} href={item.href} className={`flex items-center gap-4 rounded-2xl border border-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${item.color}`}>
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl text-white shadow-md ${item.iconColor}`}>{item.icono}</div>
              <div className="min-w-0"><p className="text-sm font-semibold">{item.titulo}</p><p className="text-3xl font-extrabold">{item.valor}</p><p className="text-xs text-slate-600">{item.detalle}</p></div>
            </Link>
          ))}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between"><h3 className="text-xl font-extrabold">Tus grupos</h3><Link href="/docente/grupos" className="text-sm font-semibold text-[#A45B91]">Ver todos →</Link></div>
            {cargandoRegistros ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">Cargando tus grupos...</div>
            ) : gruposDocente.length > 0 ? (
              <div className="space-y-3">
                {gruposDocente.map((grupo) => (
                  <article key={grupo.id} className="rounded-2xl border border-[#F1DFEE] bg-gradient-to-r from-[#FFF8FC] to-[#F8F4FF] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2"><div><h4 className="font-extrabold">{grupo.nombre}</h4><p className="mt-1 text-sm text-slate-600">{[grupo.nivel, grupo.seccion ? `Sección ${grupo.seccion}` : null].filter(Boolean).join(" · ") || "Grupo docente"}</p></div><span className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#A45B91] shadow-sm">{grupo.curso_lectivo}</span></div>
                    {grupo.descripcion && <p className="mt-2 text-xs text-slate-500">{grupo.descripcion}</p>}
                  </article>
                ))}
                {totalGrupos > gruposDocente.length && <p className="pt-1 text-center text-xs text-slate-500">Mostrando {gruposDocente.length} de {totalGrupos} grupos.</p>}
              </div>
            ) : (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-center"><span className="text-5xl">👩‍🏫</span><p className="mt-3 font-bold">Todavía no hay grupos registrados</p><p className="mt-2 text-sm text-slate-500">Cuando registres un grupo, aparecerá aquí.</p><Link href="/docente/grupos" className="mt-4 rounded-xl bg-gradient-to-r from-[#A95AC0] to-[#D45C9C] px-5 py-3 text-sm font-bold text-white shadow-sm">Crear mi primer grupo</Link></div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between"><h3 className="text-xl font-extrabold">Próximas actividades</h3><Link href="/docente/calendario" className="text-sm font-semibold text-[#A45B91] transition hover:text-[#D45C9C]">Abrir calendario →</Link></div>
            {cargandoActividades ? <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-center"><p className="text-sm text-slate-500">Cargando tus próximas actividades...</p></div> : proximasActividades.length > 0 ? (
              <div className="space-y-3">{proximasActividades.map((actividad) => (
                <div key={actividad.id} className="rounded-2xl border border-[#F1DFEE] bg-gradient-to-r from-[#FFF8FC] to-[#F8F4FF] p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><span className="inline-flex rounded-full bg-[#F0E5FC] px-3 py-1 text-xs font-semibold text-[#8754A4]">{actividad.tipo}</span><h4 className="mt-2 font-bold text-[#49375E]">{actividad.titulo}</h4></div><span className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#A45B91] shadow-sm">{formatearFecha(actividad.fecha)}</span></div><div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">{actividad.hora && <span>🕒 {actividad.hora.slice(0, 5)}</span>}{actividad.descripcion && <span className="line-clamp-2">{actividad.descripcion}</span>}</div></div>
              ))}<p className="pt-1 text-center text-xs text-slate-500">Mostrando tus próximas {proximasActividades.length} actividades.</p></div>
            ) : <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-center"><span className="text-5xl">📅</span><p className="mt-3 font-bold">Tu agenda está lista</p><p className="mt-2 text-sm text-slate-500">No tienes actividades pendientes. Cuando registres una, aparecerá aquí.</p><Link href="/docente/calendario" className="mt-4 rounded-xl bg-gradient-to-r from-[#A95AC0] to-[#D45C9C] px-5 py-3 text-sm font-bold text-white shadow-sm">Agregar actividad →</Link></div>}
          </section>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.3fr_0.8fr]">
          <section className="rounded-3xl bg-white p-5 shadow-sm"><h3 className="text-lg font-extrabold">Materiales destacados</h3><div className="mt-4 flex flex-col items-center justify-center rounded-2xl bg-amber-50 p-5 text-center"><span className="text-5xl">📚</span><p className="mt-3 font-bold">Biblioteca MR</p><p className="mt-2 text-sm text-slate-600">Consulta los materiales educativos disponibles.</p><Link href="/biblioteca" className="mt-4 rounded-xl bg-gradient-to-r from-[#A95AC0] to-[#D45C9C] px-4 py-3 text-sm font-bold text-white">Ver materiales →</Link></div></section>
          <section className="rounded-3xl bg-white p-5 shadow-sm"><h3 className="text-lg font-extrabold">Estadísticas de este mes</h3><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[#FCEAF2] p-4"><p className="text-sm text-slate-600">Grupos</p><p className="mt-1 text-2xl font-extrabold">{cargandoRegistros ? "…" : totalGrupos}</p></div><div className="rounded-2xl bg-[#E5F6EF] p-4"><p className="text-sm text-slate-600">Estudiantes</p><p className="mt-1 text-2xl font-extrabold">{cargandoRegistros ? "…" : totalEstudiantes}</p></div><div className="rounded-2xl bg-[#F0E9FC] p-4"><p className="text-sm text-slate-600">Actividades</p><p className="mt-1 text-2xl font-extrabold">{totalActividades}</p></div><div className="rounded-2xl bg-[#FFF4D9] p-4"><p className="text-sm text-slate-600">Promedio general</p><p className="mt-1 text-2xl font-extrabold">{cargandoRegistros ? "…" : promedioGeneral === null ? "—" : promedioGeneral.toFixed(2)}</p></div></div><p className="mt-3 text-xs text-slate-500">El promedio se calcula con todas las notas registradas por este docente.</p></section>
          <section className="rounded-3xl border border-[#E8D9F0] bg-gradient-to-br from-[#F7EAF5] to-[#EDE8FA] p-5 shadow-sm"><h3 className="text-lg font-extrabold">💡 Recuerda</h3><p className="mt-4 text-sm leading-relaxed text-slate-700">Mantén actualizados tus registros y aprovecha las herramientas y materiales de Campus MR.</p><div className="mt-6 text-center text-5xl">⭐</div></section>
        </div>
        <footer className="mt-8 pb-4 text-center text-xs text-slate-500">Material Didáctico MR · Campus MR 2.0</footer>
      </section>
    </main>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    async function cargarUsuario() {
      const usuarioActual = await getCurrentUser();
      if (!activo) return;
      if (!usuarioActual || !usuarioActual.activo) { router.replace("/login"); return; }
      setUsuario(usuarioActual);
      setCargando(false);
    }
    cargarUsuario();
    return () => { activo = false; };
  }, [router]);

  if (cargando) return <main className="flex min-h-screen items-center justify-center bg-gray-100"><p className="text-xl text-gray-600">Cargando CAMPUS MR 2.0...</p></main>;
  if (!usuario) return null;
  if (usuario.rol === "docente") return <DashboardDocente usuario={usuario} />;

  return (
    <main className="min-h-screen bg-[#f5f4fc] p-6 text-[#17213f] sm:p-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold text-slate-500">CAMPUS MR 2.0</p><h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Bienvenido, {usuario.nombre}</h1><p className="mt-2 text-slate-500">Seleccioná una opción para continuar.</p></div><Link href="/perfil" className="rounded-full bg-white px-5 py-3 font-semibold shadow-sm transition hover:shadow-md">👤 Mi perfil</Link></header>
        {usuario.rol === "estudiante" && <><div className="mb-7 rounded-3xl bg-gradient-to-r from-blue-100 to-indigo-100 p-7"><p className="text-sm font-bold text-blue-700">ESPACIO DE APRENDIZAJE</p><h2 className="mt-2 text-3xl font-extrabold">¡Continuá tu preparación!</h2><p className="mt-2 text-slate-600">Accedé a tus módulos y practicá con el banco de preguntas.</p></div><div className="grid grid-cols-1 gap-6 md:grid-cols-2"><Link href="/campus" className="rounded-3xl bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="text-5xl">📚</div><h2 className="mt-5 text-2xl font-extrabold">Mi preparación</h2><p className="mt-2 text-slate-500">Ingresá a tus módulos de estudio.</p><span className="mt-5 inline-block font-bold text-blue-700">Entrar a mis módulos →</span></Link><Link href="/banco" className="rounded-3xl bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="text-5xl">📝</div><h2 className="mt-5 text-2xl font-extrabold">Banco de preguntas</h2><p className="mt-2 text-slate-500">Practicá y comprobá tus conocimientos.</p><span className="mt-5 inline-block font-bold text-purple-700">Comenzar práctica →</span></Link></div></>}
        {usuario.rol === "admin" && <div className="rounded-3xl bg-gradient-to-r from-red-100 to-orange-100 p-7"><div className="text-5xl">⚙️</div><h2 className="mt-4 text-2xl font-extrabold">Administración de CAMPUS MR</h2><p className="mt-2 text-slate-600">Gestioná usuarios, módulos y recursos de la plataforma.</p><Link href="/admin" className="mt-6 inline-block rounded-xl bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-700">Entrar a administración →</Link></div>}
        {usuario.rol === "asesora" && <div className="rounded-3xl bg-gradient-to-r from-purple-100 to-indigo-100 p-7 shadow-sm"><div className="text-5xl">📊</div><p className="mt-4 text-sm font-bold tracking-wider text-purple-700">ESPACIO DE ASESORÍA</p><h2 className="mt-2 text-3xl font-extrabold">Seguimiento y acompañamiento educativo</h2><p className="mt-3 max-w-2xl text-slate-600">Ingresá a tu espacio de trabajo para organizar los procesos de seguimiento, orientación y acompañamiento.</p><Link href="/asesora" className="mt-6 inline-flex items-center rounded-xl bg-purple-700 px-6 py-3 font-bold text-white shadow transition hover:bg-purple-800">Entrar al panel de asesoría →</Link></div>}
      </div>
      <footer className="mt-10 text-center text-xs text-slate-500">Material Didáctico MR · CAMPUS MR 2.0</footer>
    </main>
  );
}
