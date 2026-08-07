import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

function obtenerYoutubeEmbed(url: string) {
  try {
    const videoId = new URL(url).searchParams.get("v");

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }

    if (url.includes("youtu.be/")) {
      return `https://www.youtube.com/embed/${url.split("youtu.be/")[1]}`;
    }

    return url;

  } catch {

    return url;

  }
}

export default async function ModuloPage({ params }: Props) {

  const { id } = await params;

  const { data: modulo } = await supabase
    .from("modulos")
    .select("*")
    .eq("id", id)
    .single();

  if (!modulo) {
    notFound();
  }

  const { data: videos } = await supabase
    .from("videos")
    .select("*")
    .eq("modulo_id", id)
    .eq("activo", true)
    .order("orden");

  const { data: pdfs } = await supabase
    .from("pdfs")
    .select("*")
    .eq("modulo_id", id)
    .eq("activo", true)
    .order("orden");

  const { data: recursos } = await supabase
    .from("recursos")
    .select("*")
    .eq("modulo_id", id)
    .eq("activo", true)
    .order("orden");

  return (

    <main className="min-h-screen bg-gray-100">

      <section className="bg-gradient-to-r from-red-700 to-red-500 text-white">

        <div className="max-w-7xl mx-auto px-10 py-14">

          <Link
            href="/campus"
            className="text-white/90 hover:text-white"
          >
            ← Volver al Campus
          </Link>

          <h1 className="text-5xl font-black mt-6">
            {modulo.titulo}
          </h1>

          <p className="text-xl mt-6 max-w-4xl leading-8">

            {modulo.descripcion}

          </p>

        </div>

      </section>

      <div className="max-w-7xl mx-auto px-10 py-12 space-y-10">

        {/* CLASES */}

        <section className="bg-white rounded-2xl shadow-lg overflow-hidden">

          <div className="bg-red-600 text-white px-8 py-5">

            <h2 className="text-3xl font-bold">

              🎥 Clases

            </h2>

          </div>

          <div className="p-8">

            {videos && videos.length > 0 ? (

              <div className="space-y-10">

                {videos.map((video: any) => (

                  <div
                    key={video.id}
                  >

                    <h3 className="font-bold text-2xl mb-4">

                      {video.titulo}

                    </h3>

                    <iframe
                      src={obtenerYoutubeEmbed(video.youtube_url)}
                      className="w-full aspect-video rounded-xl"
                      allowFullScreen
                    />

                  </div>

                ))}

              </div>

            ) : (

              <p className="text-gray-500">

                No hay clases disponibles.

              </p>

            )}

          </div>

        </section>

        {/* MATERIAL */}

        <section className="bg-white rounded-2xl shadow-lg overflow-hidden">

          <div className="bg-blue-600 text-white px-8 py-5">

            <h2 className="text-3xl font-bold">

              📄 Material de estudio

            </h2>

          </div>

          <div className="p-8">

            {pdfs && pdfs.length > 0 ? (

              <div className="space-y-4">

                {pdfs.map((pdf: any) => (

                  <div
                    key={pdf.id}
                    className="flex justify-between items-center border rounded-xl p-5"
                  >

                    <div>

                      <h3 className="font-bold text-lg">

                        {pdf.titulo}

                      </h3>

                    </div>

                    <a
                      href={pdf.url}
                      target="_blank"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
                    >
                      Abrir
                    </a>

                  </div>

                ))}

              </div>

            ) : (

              <p className="text-gray-500">

                No hay material disponible.

              </p>

            )}

          </div>

        </section>

        {/* COMPLEMENTARIO */}

        <section className="bg-white rounded-2xl shadow-lg overflow-hidden">

          <div className="bg-green-600 text-white px-8 py-5">

            <h2 className="text-3xl font-bold">

              📚 Material complementario

            </h2>

          </div>

          <div className="p-8">

            {recursos && recursos.length > 0 ? (

              <div className="space-y-4">

                {recursos.map((recurso: any) => (

                  <div
                    key={recurso.id}
                    className="flex justify-between items-center border rounded-xl p-5"
                  >

                    <div>

                      <h3 className="font-bold text-lg">

                        {recurso.titulo}

                      </h3>

                      <p className="text-gray-500">

                        {recurso.tipo}

                      </p>

                    </div>

                    <a
                      href={recurso.url}
                      target="_blank"
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold"
                    >
                      Descargar
                    </a>

                  </div>

                ))}

              </div>

            ) : (

              <p className="text-gray-500">

                No hay material complementario.

              </p>

            )}

          </div>

        </section>

        {/* PRACTICA */}

        <section className="bg-white rounded-2xl shadow-lg overflow-hidden">

          <div className="bg-orange-500 text-white px-8 py-5">

            <h2 className="text-3xl font-bold">

              📝 Práctica del módulo

            </h2>

          </div>

          <div className="p-8">

            <p className="text-xl text-gray-700 mb-8">

              Refuerza tus conocimientos respondiendo las preguntas
              correspondientes a este módulo.

            </p>

            <Link
              href={`/practica/${id}`}
              className="inline-block bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-xl font-bold text-lg"
            >
              Comenzar práctica
            </Link>

          </div>

        </section>

      </div>

    </main>

  );

}