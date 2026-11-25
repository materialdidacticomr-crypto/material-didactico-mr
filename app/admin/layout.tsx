
"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getCurrentUser, UsuarioActual } from "@/lib/auth";
import { ShieldCheck } from "lucide-react";

interface Props {
  children: ReactNode;
}

export default function AdminLayout({ children }: Props) {
  const router = useRouter();

  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    async function comprobarAcceso() {
      const usuarioActual = await getCurrentUser();

      if (!activo) return;

      if (!usuarioActual || !usuarioActual.activo) {
        router.replace("/login");
        return;
      }

      if (
        usuarioActual.rol !== "admin" &&
        usuarioActual.rol !== "asesora"
      ) {
        router.replace("/campus");
        return;
      }

      setUsuario(usuarioActual);
      setCargando(false);
    }

    comprobarAcceso();

    return () => {
      activo = false;
    };
  }, [router]);

  if (cargando) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#111827]">
        <div className="rounded-2xl border border-slate-700 bg-[#1F2937] px-10 py-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-blue-400" />

          <p className="text-lg font-bold text-white">
            Verificando acceso
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Preparando el centro administrativo...
          </p>
        </div>
      </main>
    );
  }

  if (
    !usuario ||
    (usuario.rol !== "admin" && usuario.rol !== "asesora")
  ) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#111827] lg:flex-row">

      {/* BARRA LATERAL */}
      <AdminSidebar />

      {/* CONTENIDO PRINCIPAL */}
      <main className="min-w-0 flex-1 bg-[#111827]">

        {/* ENCABEZADO OSCURO */}
        <header className="sticky top-0 z-30 border-b border-slate-700/80 bg-[#182335]/95 px-5 py-4 shadow-[0_4px_25px_rgba(0,0,0,0.20)] backdrop-blur-xl sm:px-8">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>
              <div className="mb-1 flex items-center gap-2">
                <ShieldCheck
                  size={18}
                  className="text-blue-400"
                />

                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-300">
                  MR Academy · Administración
                </span>
              </div>

              <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                Panel de Administración
              </h1>

              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Material Didáctico MR Academy
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 shadow-inner">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />

              <div>
                <p className="max-w-[180px] truncate text-xs font-bold text-white">
                  {usuario.nombre}
                </p>

                <p className="text-[10px] text-slate-400">
                  {usuario.rol === "admin"
                    ? "Administrador principal"
                    : "Asesora"}
                </p>
              </div>
            </div>

          </div>
        </header>

        {/* ÁREA DE TRABAJO */}
        <section className="min-h-[calc(100vh-90px)] w-full bg-[#111827]">
          {children}
        </section>

      </main>
    </div>
  );
}
