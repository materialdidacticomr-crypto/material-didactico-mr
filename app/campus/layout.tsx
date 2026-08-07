import { ReactNode } from "react";
import NavbarCampus from "@/components/NavbarCampus";

interface Props {
  children: ReactNode;
}

export default function CampusLayout({
  children,
}: Props) {

  return (

    <div className="min-h-screen bg-gray-100 flex flex-col">

      <NavbarCampus />

      <main className="flex-1">

        {children}

      </main>

      <footer className="bg-white border-t mt-16">

        <div className="max-w-7xl mx-auto px-8 py-8 text-center">

          <h3 className="text-xl font-bold text-red-600">

            Material Didáctico MR

          </h3>

          <p className="text-gray-500 mt-2">

            Campus Virtual para la preparación de la
            Prueba Nacional de Idoneidad Docente.

          </p>

          <p className="text-sm text-gray-400 mt-6">

            © {new Date().getFullYear()} Material Didáctico MR.
            Todos los derechos reservados.

          </p>

        </div>

      </footer>

    </div>

  );

}