"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { getCurrentUser, UsuarioActual } from "@/lib/auth";

interface Props {
  children: ReactNode;
}

export default function AdminLayout({ children }: Props) {
  const router = useRouter();

  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function comprobarAcceso() {
      const usuarioActual = await getCurrentUser();

      if (!usuarioActual) {
        router.replace("/login");
        return;
      }

      if (!usuarioActual.activo) {
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
  }, [router]);

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600 text-xl">
          Comprobando acceso...
        </p>
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
    <div className="min-h-screen flex bg-gray-100">

      <AdminSidebar />

      <main className="flex-1">

        <header className="bg-white shadow-sm border-b px-8 py-5">

          <h1 className="text-3xl font-bold text-gray-800">
            Panel de Administración
          </h1>

          <p className="text-gray-500 mt-1">
            Material Didáctico MR Academy
          </p>

        </header>

        <section className="p-8">
          {children}
        </section>

      </main>

    </div>
  );
}