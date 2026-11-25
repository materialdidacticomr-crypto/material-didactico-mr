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
    <header className="sticky top-0 z-50 border-b border-[#F0E3ED] bg-white/90 shadow-[0_4px_20px_rgba(177,135,179,0.08)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/campus"
          className="flex min-w-0 items-center gap-3 rounded-xl outline-none transition hover:opacity-85 focus-visible:ring-2 focus-visible:ring-[#D45C9C]"
          aria-label="Material Didáctico MR, ir al campus"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#F1E0EC] bg-white p-1 shadow-sm sm:h-12 sm:w-12">
            <img
              src="/logo-material-didactico-mr.png"
              alt="Logotipo de Material Didáctico MR"
              className="h-full w-full object-contain"
            />
          </span>

          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold leading-tight text-[#49375E] sm:text-base">
              Material Didáctico{" "}
              <span className="text-[#D45C9C]">MR</span>
            </span>
            <span className="mt-0.5 block text-[9px] font-semibold tracking-[0.24em] text-[#A28AAE]">
              ACADEMY
            </span>
          </span>
        </Link>

        <nav
          aria-label="Navegación principal"
          className="flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-3"
        >
          <Link
            href="/"
            className="hidden rounded-full px-3 py-2 text-xs font-bold text-[#806F8D] transition hover:bg-[#FCEAF2] hover:text-[#B84786] sm:inline-flex"
          >
            Inicio
          </Link>

          <Link
            href="/campus"
            className="rounded-full bg-[#FCEAF2] px-3 py-2 text-[11px] font-bold text-[#B84786] transition hover:bg-[#F6DDEC] sm:text-xs"
          >
            Mis módulos
          </Link>

          <Link
            href="/perfil"
            className="hidden rounded-full px-3 py-2 text-xs font-bold text-[#806F8D] transition hover:bg-[#F0E9FC] hover:text-[#7958A7] sm:inline-flex"
          >
            Mi perfil
          </Link>

          <button
            type="button"
            onClick={cerrarSesion}
            className="ml-1 rounded-full bg-gradient-to-r from-[#B65BC0] to-[#D65B9B] px-3 py-2 text-[11px] font-extrabold text-white shadow-md shadow-[#D8B6DF]/30 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D45C9C] focus-visible:ring-offset-2 sm:ml-2 sm:px-5 sm:text-xs"
          >
            Cerrar sesión
          </button>
        </nav>
      </div>
    </header>
  );
}
