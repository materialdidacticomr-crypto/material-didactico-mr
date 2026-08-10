"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, UsuarioActual } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarUsuario() {
      const usuarioActual = await getCurrentUser();

      if (!usuarioActual) {
        router.replace("/login");
        return;
      }

      if (!usuarioActual.activo) {
        router.replace("/login");
        return;
      }

      setUsuario(usuarioActual);
      setCargando(false);
    }

    cargarUsuario();
  }, [router]);

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600 text-xl">
          Cargando...
        </p>
      </main>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-10">

      <h1 className="text-4xl font-bold text-red-600">
        Bienvenido, {usuario.nombre}
      </h1>

      <p className="text-gray-600 mt-2 mb-10">
        Seleccione una opción para continuar.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

        <Link
          href="/campus"
          className="bg-white shadow-lg rounded-xl p-8 text-center hover:shadow-xl transition"
        >
          <h2 className="text-4xl">
            📚
          </h2>

          <p className="mt-4 font-semibold text-lg">
            Mi Preparación
          </p>
        </Link>

        <Link
          href="/banco"
          className="bg-white shadow-lg rounded-xl p-8 text-center hover:shadow-xl transition"
        >
          <h2 className="text-4xl">
            📝
          </h2>

          <p className="mt-4 font-semibold text-lg">
            Banco de Preguntas
          </p>
        </Link>

        <Link
          href="/perfil"
          className="bg-white shadow-lg rounded-xl p-8 text-center hover:shadow-xl transition"
        >
          <h2 className="text-4xl">
            👤
          </h2>

          <p className="mt-4 font-semibold text-lg">
            Mi Perfil
          </p>
        </Link>

        {usuario.rol === "admin" && (
          <Link
            href="/admin"
            className="bg-red-600 text-white shadow-lg rounded-xl p-8 text-center hover:bg-red-700 transition"
          >
            <h2 className="text-4xl">
              ⚙️
            </h2>

            <p className="mt-4 font-semibold text-lg">
              Administración
            </p>
          </Link>
        )}

      </div>

    </main>
  );
}