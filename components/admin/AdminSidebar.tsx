"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, UsuarioActual } from "@/lib/auth";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [usuario, setUsuario] =
    useState<UsuarioActual | null>(null);

  useEffect(() => {
    async function cargarUsuario() {
      const usuarioActual = await getCurrentUser();
      setUsuario(usuarioActual);
    }

    cargarUsuario();
  }, []);

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const menuAdmin = [
    {
      nombre: "Dashboard",
      ruta: "/admin",
      icono: "🏠",
    },
    {
      nombre: "Usuarios",
      ruta: "/admin/usuarios",
      icono: "👥",
    },
    {
      nombre: "Módulos",
      ruta: "/admin/modulos",
      icono: "📚",
    },
    {
      nombre: "Videos",
      ruta: "/admin/videos",
      icono: "🎥",
    },
    {
      nombre: "PDFs",
      ruta: "/admin/pdfs",
      icono: "📄",
    },
    {
      nombre: "Recursos",
      ruta: "/admin/recursos",
      icono: "📚",
    },
    {
      nombre: "Preguntas",
      ruta: "/admin/preguntas",
      icono: "📝",
    },
    {
      nombre: "Estadísticas",
      ruta: "/admin/estadisticas",
      icono: "📊",
    },
    {
      nombre: "Configuración",
      ruta: "/admin/configuracion",
      icono: "⚙️",
    },
  ];

  const menuAsesora = [
    {
      nombre: "Dashboard",
      ruta: "/admin",
      icono: "🏠",
    },
    {
      nombre: "Videos",
      ruta: "/admin/videos",
      icono: "🎥",
    },
    {
      nombre: "PDFs",
      ruta: "/admin/pdfs",
      icono: "📄",
    },
    {
      nombre: "Recursos",
      ruta: "/admin/recursos",
      icono: "📚",
    },
    {
      nombre: "Preguntas",
      ruta: "/admin/preguntas",
      icono: "📝",
    },
  ];

  const menu =
    usuario?.rol === "asesora"
      ? menuAsesora
      : menuAdmin;

  return (
    <aside className="w-72 bg-red-700 text-white min-h-screen flex flex-col">

      {/* ENCABEZADO */}

      <div className="p-6 border-b border-red-600">

        <h1 className="text-2xl font-bold">
          MR Academy
        </h1>

        <p className="text-red-100 text-sm">
          Panel Administrativo
        </p>

        {usuario && (
          <div className="mt-4">

            <p className="font-semibold">
              {usuario.nombre}
            </p>

            <p className="text-red-100 text-sm">
              {usuario.rol === "admin"
                ? "Administrador"
                : "Asesora"}
            </p>

          </div>
        )}

      </div>

      {/* MENÚ ADMINISTRATIVO */}

      <nav className="flex-1 p-4 space-y-2">

        {menu.map((item) => (

          <Link
            key={item.ruta}
            href={item.ruta}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${
              pathname === item.ruta
                ? "bg-white text-red-700 font-bold"
                : "hover:bg-red-600"
            }`}
          >

            <span>
              {item.icono}
            </span>

            <span>
              {item.nombre}
            </span>

          </Link>

        ))}

        {/* VOLVER AL CAMPUS */}

        <div className="pt-4 mt-4 border-t border-red-600">

          <Link
            href="/campus"
            className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${
              pathname.startsWith("/campus")
                ? "bg-white text-red-700 font-bold"
                : "hover:bg-red-600"
            }`}
          >

            <span>
              🏫
            </span>

            <span>
              Volver al Campus
            </span>

          </Link>

        </div>

      </nav>

      {/* CERRAR SESIÓN */}

      <div className="p-4 border-t border-red-600">

        <button
          onClick={cerrarSesion}
          className="w-full bg-white text-red-700 font-bold rounded-lg py-3 hover:bg-gray-100 transition"
        >
          🚪 Cerrar sesión
        </button>

      </div>

    </aside>
  );
}