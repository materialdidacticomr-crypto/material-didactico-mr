"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PerfilPage() {

  const router = useRouter();

  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    cargarUsuario();
  }, []);

  async function cargarUsuario() {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {

      router.push("/login");

      return;

    }

    setUsuario(user);

  }

  async function cerrarSesion() {

    await supabase.auth.signOut();

    router.push("/login");

  }

  return (

    <main className="min-h-screen bg-gray-100">

      <div className="max-w-5xl mx-auto p-10">

        <div className="bg-white rounded-2xl shadow-lg p-10">

          <div className="flex items-center gap-6">

            <div className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center text-white text-4xl font-bold">

              {usuario?.email?.charAt(0).toUpperCase()}

            </div>

            <div>

              <h1 className="text-4xl font-bold text-red-600">

                Mi Perfil

              </h1>

              <p className="text-gray-500 mt-2">

                Información de tu cuenta.

              </p>

            </div>

          </div>

          <div className="mt-10 grid gap-6">

            <div className="border rounded-xl p-6">

              <p className="text-gray-500">

                Correo electrónico

              </p>

              <h2 className="text-2xl font-bold mt-2">

                {usuario?.email}

              </h2>

            </div>

            <div className="border rounded-xl p-6">

              <p className="text-gray-500">

                Estado

              </p>

              <h2 className="text-2xl font-bold mt-2 text-green-600">

                Activo

              </h2>

            </div>

          </div>

          <button
            onClick={cerrarSesion}
            className="mt-10 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold"
          >
            Cerrar sesión
          </button>

        </div>

      </div>

    </main>

  );

}