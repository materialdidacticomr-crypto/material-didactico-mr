import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function CampusPage() {

  const { data: modulos } = await supabase
    .from("modulos")
    .select("*")
    .eq("activo", true)
    .order("orden");

  return (

    <main className="min-h-screen bg-gray-100">

      {/* HERO */}

      <section className="bg-gradient-to-r from-red-700 to-red-500 text-white">

        <div className="max-w-7xl mx-auto px-10 py-20">

          <h1 className="text-6xl font-black">
            Material Didáctico MR
          </h1>

          <h2 className="text-3xl mt-3 font-light">
            Campus Virtual
          </h2>

          <p className="mt-8 text-xl max-w-3xl leading-9">

            Prepárate para la Prueba Nacional de Idoneidad Docente
            mediante clases, materiales de estudio y prácticas
            organizadas por módulos.

          </p>

        </div>

      </section>

      {/* ESTADÍSTICAS */}

      <section className="max-w-7xl mx-auto px-10 -mt-10">

        <div className="grid md:grid-cols-4 gap-6">

          <div className="bg-white rounded-2xl shadow-lg p-8">

            <div className="text-5xl mb-3">
              📘
            </div>

            <div className="text-4xl font-bold text-red-600">
              {modulos?.length || 0}
            </div>

            <p className="text-gray-500 mt-2">
              Módulos
            </p>

          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">

            <div className="text-5xl mb-3">
              🎥
            </div>

            <div className="text-4xl font-bold text-red-600">
              Videos
            </div>

            <p className="text-gray-500 mt-2">
              Clases disponibles
            </p>

          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">

            <div className="text-5xl mb-3">
              📄
            </div>

            <div className="text-4xl font-bold text-red-600">
              PDFs
            </div>

            <p className="text-gray-500 mt-2">
              Material de estudio
            </p>

          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">

            <div className="text-5xl mb-3">
              📝
            </div>

            <div className="text-4xl font-bold text-red-600">
              Práctica
            </div>

            <p className="text-gray-500 mt-2">
              Banco de preguntas
            </p>

          </div>

        </div>

      </section>

      {/* MÓDULOS */}

      <section className="max-w-7xl mx-auto px-10 py-16">

        <h2 className="text-4xl font-bold mb-10 text-gray-800">

          Mis módulos

        </h2>

        <div className="grid lg:grid-cols-2 gap-8">

          {modulos?.map((modulo: any) => (

            <div
              key={modulo.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition overflow-hidden"
            >

              <div className="bg-red-600 h-3" />

              <div className="p-8">

                <h3 className="text-3xl font-bold text-red-600">

                  {modulo.titulo}

                </h3>

                <p className="mt-4 text-gray-600 leading-8">

                  {modulo.descripcion}

                </p>

                <div className="grid grid-cols-3 gap-4 mt-8">

                  <div className="bg-gray-100 rounded-xl p-4 text-center">

                    🎥

                    <p className="mt-2 text-sm font-semibold">

                      Clases

                    </p>

                  </div>

                  <div className="bg-gray-100 rounded-xl p-4 text-center">

                    📄

                    <p className="mt-2 text-sm font-semibold">

                      Material

                    </p>

                  </div>

                  <div className="bg-gray-100 rounded-xl p-4 text-center">

                    📝

                    <p className="mt-2 text-sm font-semibold">

                      Práctica

                    </p>

                  </div>

                </div>

                <Link
                  href={`/campus/${modulo.id}`}
                  className="block mt-8 bg-red-600 hover:bg-red-700 text-white text-center py-4 rounded-xl font-bold text-lg"
                >
                  Continuar
                </Link>

              </div>

            </div>

          ))}

        </div>

      </section>

    </main>

  );

}