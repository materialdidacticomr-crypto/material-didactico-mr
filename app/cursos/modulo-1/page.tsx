import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default async function Modulo1() {
  // Obtener información del módulo
  const { data: modulo } = await supabase
    .from("modulos")
    .select("*")
    .eq("orden", 1)
    .single();

  // Obtener videos del módulo
  const { data: videos } = await supabase
    .from("videos")
    .select("*")
    .eq("modulo_id", modulo?.id)
    .order("orden");

  return (
    <main className="min-h-screen bg-gray-100 p-10">

      <Link
        href="/cursos"
        className="text-red-600 font-semibold"
      >
        ← Volver a Ruta de Preparación
      </Link>

      <h1 className="text-4xl font-bold text-red-600 mt-6">
        Módulo 1
      </h1>

      <h2 className="text-2xl mt-2 mb-10">
        {modulo?.titulo}
      </h2>

      <div className="space-y-6">

        <div className="bg-white p-6 rounded-xl shadow">

          <h3 className="text-xl font-bold mb-4">
            🎥 Videos
          </h3>

          {videos?.map((video) => (

            <div
              key={video.id}
              className="border rounded-lg p-4 mb-4"
            >
              <h4 className="font-semibold">
                {video.titulo}
              </h4>

              <a
                href={video.youtube_url}
                target="_blank"
                className="text-red-600 font-semibold"
              >
                ▶ Ver en YouTube
              </a>

            </div>

          ))}

        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          📄 Material PDF
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          🖼️ Material de apoyo
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          ✅ Práctica del módulo
        </div>

      </div>

    </main>
  );
}