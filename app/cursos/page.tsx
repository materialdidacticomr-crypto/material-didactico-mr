import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default async function CursosPage() {
  const { data: modulos, error } = await supabase
    .from("modulos")
    .select("*")
    .order("orden");

  if (error) {
    return (
      <main className="p-10">
        <h1 className="text-red-600 text-2xl">
          Error al cargar los módulos
        </h1>

        <p>{error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-10">

      <h1 className="text-4xl font-bold text-red-600">
        Ruta de Preparación
      </h1>

      <p className="text-gray-600 mt-2 mb-10">
        Siga los módulos en orden para prepararse para la Prueba de Idoneidad Docente.
      </p>

      <div className="grid md:grid-cols-2 gap-8">

        {modulos?.map((modulo) => (

          <Link
            key={modulo.id}
            href={`/cursos/modulo-${modulo.orden}`}
            className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition"
          >

            <h2 className="text-2xl font-bold">
              📘 Módulo {modulo.orden}
            </h2>

            <p className="mt-3 text-gray-600">
              {modulo.titulo}
            </p>

            <div className="mt-6 space-y-2 text-sm text-gray-500">

              <p>🎥 Videos</p>

              <p>📄 Material PDF</p>

              <p>🖼 Material de apoyo</p>

              <p>✅ Práctica del módulo</p>

            </div>

          </Link>

        ))}

      </div>

    </main>
  );
}