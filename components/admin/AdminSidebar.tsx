
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, UsuarioActual } from "@/lib/auth";

import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
  FileText,
  FolderOpen,
  ClipboardList,
  BarChart3,
  Settings,
  GraduationCap,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);

  useEffect(() => {
    let activo = true;

    async function cargarUsuario() {
      const usuarioActual = await getCurrentUser();

      if (activo) {
        setUsuario(usuarioActual);
      }
    }

    cargarUsuario();

    return () => {
      activo = false;
    };
  }, []);

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const menuAdmin = [
    {
      nombre: "Dashboard",
      ruta: "/admin",
      icono: LayoutDashboard,
    },
    {
      nombre: "Usuarios",
      ruta: "/admin/usuarios",
      icono: Users,
    },
    {
      nombre: "Módulos",
      ruta: "/admin/modulos",
      icono: BookOpen,
    },
    {
      nombre: "Videos",
      ruta: "/admin/videos",
      icono: Video,
    },
    {
      nombre: "PDFs",
      ruta: "/admin/pdfs",
      icono: FileText,
    },
    {
      nombre: "Recursos",
      ruta: "/admin/recursos",
      icono: FolderOpen,
    },
    {
      nombre: "Preguntas",
      ruta: "/admin/preguntas",
      icono: ClipboardList,
    },
    {
      nombre: "Estadísticas",
      ruta: "/admin/estadisticas",
      icono: BarChart3,
    },
    {
      nombre: "Configuración",
      ruta: "/admin/configuracion",
      icono: Settings,
    },
  ];

  const menuAsesora = [
    {
      nombre: "Dashboard",
      ruta: "/admin",
      icono: LayoutDashboard,
    },
    {
      nombre: "Videos",
      ruta: "/admin/videos",
      icono: Video,
    },
    {
      nombre: "PDFs",
      ruta: "/admin/pdfs",
      icono: FileText,
    },
    {
      nombre: "Recursos",
      ruta: "/admin/recursos",
      icono: FolderOpen,
    },
    {
      nombre: "Preguntas",
      ruta: "/admin/preguntas",
      icono: ClipboardList,
    },
  ];

  const menu = usuario?.rol === "asesora" ? menuAsesora : menuAdmin;

  return (
    <aside className="relative z-20 flex min-h-screen w-full shrink-0 flex-col overflow-hidden border-r border-slate-700/80 bg-gradient-to-b from-[#202B3D] via-[#172233] to-[#111827] text-slate-100 shadow-[8px_0_35px_rgba(255,255,255,0.045)] lg:sticky lg:top-0 lg:h-screen lg:w-72">

      {/* BRILLO DECORATIVO */}
      <div className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-[90px]" />
      <div className="pointer-events-none absolute -right-24 bottom-20 h-64 w-64 rounded-full bg-red-500/10 blur-[90px]" />

      {/* ENCABEZADO */}
      <div className="relative border-b border-white/10 px-6 pb-6 pt-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-xl font-black text-white shadow-[0_0_22px_rgba(255,255,255,0.12)]">
            MR
          </div>

          <div>
            <h1 className="text-xl font-black tracking-wide text-white">
              MR ACADEMY
            </h1>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
              Control administrativo
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-300/20 bg-gradient-to-br from-red-500/30 to-red-800/30 text-red-100 shadow-lg">
              <ShieldCheck size={23} strokeWidth={2} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">
                {usuario?.nombre || "Cargando usuario..."}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                {usuario?.rol === "admin"
                  ? "Administrador principal"
                  : usuario?.rol === "asesora"
                    ? "Asesora"
                    : "Cuenta administrativa"}
              </p>
            </div>

            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.75)]" />
          </div>
        </div>
      </div>

      {/* ETIQUETA DEL MENÚ */}
      <div className="relative px-6 pb-3 pt-7">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
          Menú principal
        </p>
      </div>

      {/* MENÚ */}
      <nav className="relative flex-1 space-y-1.5 overflow-y-auto px-4 pb-5">
        {menu.map((item) => {
          const Icono = item.icono;

          const seleccionado =
            pathname === item.ruta ||
            (item.ruta !== "/admin" &&
              pathname.startsWith(`${item.ruta}/`));

          return (
            <Link
              key={item.ruta}
              href={item.ruta}
              className={`group relative flex items-center gap-3.5 overflow-hidden rounded-xl px-4 py-3.5 transition-all duration-200 ${
                seleccionado
                  ? "border border-red-300/25 bg-gradient-to-r from-[#C72C3A] to-[#A91F30] text-white shadow-[0_5px_22px_rgba(220,38,55,0.25)]"
                  : "border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.075] hover:text-white"
              }`}
            >
              {seleccionado && (
                <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.65)]" />
              )}

              <Icono
                size={21}
                strokeWidth={seleccionado ? 2.5 : 2}
                className={`shrink-0 transition-transform duration-200 ${
                  seleccionado
                    ? "text-white"
                    : "text-slate-400 group-hover:scale-110 group-hover:text-blue-300"
                }`}
              />

              <span className="flex-1 text-[14px] font-semibold tracking-wide">
                {item.nombre}
              </span>

              {seleccionado && (
                <ChevronRight
                  size={17}
                  className="text-white/90"
                />
              )}
            </Link>
          );
        })}

        {/* VOLVER AL CAMPUS */}
        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="mb-3 px-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">
            Navegación
          </p>

          <Link
            href="/campus"
            className={`group flex items-center gap-3.5 rounded-xl border px-4 py-3.5 transition-all duration-200 ${
              pathname.startsWith("/campus")
                ? "border-blue-300/25 bg-blue-500/15 text-white"
                : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.075] hover:text-white"
            }`}
          >
            <GraduationCap
              size={22}
              className="shrink-0 text-blue-300 transition-transform group-hover:scale-110"
            />

            <span className="flex-1 text-[14px] font-semibold tracking-wide">
              Volver al Campus
            </span>

            <ChevronRight
              size={17}
              className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-white"
            />
          </Link>
        </div>
      </nav>

      {/* CERRAR SESIÓN */}
      <div className="relative border-t border-white/10 bg-black/10 p-4">
        <button
          onClick={cerrarSesion}
          className="group flex w-full items-center justify-center gap-3 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3.5 text-sm font-bold text-red-200 transition-all duration-200 hover:border-red-400/40 hover:bg-red-500/20 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.12)]"
        >
          <LogOut
            size={20}
            strokeWidth={2.2}
            className="transition-transform group-hover:-translate-x-1"
          />

          <span>Cerrar sesión</span>
        </button>

        <p className="mt-4 text-center text-[10px] font-medium tracking-wider text-slate-600">
          MATERIAL DIDÁCTICO MR · 2.0
        </p>
      </div>
    </aside>
  );
}
