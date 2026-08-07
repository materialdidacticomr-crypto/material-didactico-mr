"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NavbarCampus() {

  const router = useRouter();

  async function cerrarSesion() {

    await supabase.auth.signOut();

    router.push("/login");

    router.refresh();

  }

  return (

    <header className="bg-white shadow-md sticky top-0 z-50">

      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">

        <Link
          href="/campus"
          className="text-2xl font-black text-red-600"
        >
          Material Didáctico MR
        </Link>

        <nav className="flex items-center gap-8">

          <Link
            href="/campus"
            className="font-semibold hover:text-red-600"
          >
            Inicio
          </Link>

          <Link
            href="/campus"
            className="font-semibold hover:text-red-600"
          >
            Mis módulos
          </Link>

          <Link
            href="/perfil"
            className="font-semibold hover:text-red-600"
          >
            Mi perfil
          </Link>

          <button
            onClick={cerrarSesion}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold"
          >
            Cerrar sesión
          </button>

        </nav>

      </div>

    </header>

  );

}