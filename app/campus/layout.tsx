
import { ReactNode } from "react";
import NavbarCampus from "@/components/NavbarCampus";

interface Props {
  children: ReactNode;
}

export default function CampusLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf9fc]">
      <NavbarCampus />

      <main className="flex-1">
        {children}
      </main>

      <footer className="relative mt-16 overflow-hidden border-t border-rose-100 bg-white">
        {/* Decoración de fondo */}
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-rose-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-purple-100/70 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-10 sm:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Logo oficial */}
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-rose-100 bg-white p-2 shadow-lg shadow-rose-100/50">
              <img
                src="/logo-material-didactico-mr.png"
                alt="Material Didáctico MR"
                className="h-full w-full object-contain"
              />
            </div>

            <h3 className="bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-xl font-black tracking-wide text-transparent sm:text-2xl">
              Material Didáctico MR
            </h3>

            <p className="mt-2 text-sm font-semibold text-slate-600">
              ACADEMY · CAMPUS MR 2.0
            </p>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500">
              Campus Virtual para la preparación de la
              Prueba Nacional de Idoneidad Docente.
            </p>

            {/* Línea decorativa */}
            <div className="my-7 h-1 w-24 rounded-full bg-gradient-to-r from-rose-300 via-pink-400 to-purple-300" />

            <p className="text-xs font-medium text-slate-400">
              © {new Date().getFullYear()} Material Didáctico MR.
              Todos los derechos reservados.
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Creado con dedicación para la comunidad docente.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
