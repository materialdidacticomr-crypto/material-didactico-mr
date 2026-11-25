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
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const videoId = parsedUrl.pathname.split("/").filter(Boolean)[0];
      return videoId
        ? `https://www.youtube.com/embed/${videoId}`
        : url;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const videoId =
        parsedUrl.searchParams.get("v") ||
        parsedUrl.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1];

      return videoId
        ? `https://www.youtube.com/embed/${videoId}`
        : url;
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
    <main className="relative min-h-screen overflow-hidden bg-[#FFF9FC] text-[#49375E]">
      {/* Iluminación suave de la identidad MR */}
      <div className="pointer-events-none absolute -right-40 top-0 h-[30rem] w-[30rem] rounded-full bg-[#EADCFB]/60 blur-[100px]" />
      <div className="pointer-events-none absolute -left-40 top-[38rem] h-[28rem] w-[28rem] rounded-full bg-[#F8DCEB]/60 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-7 sm:px-8 sm:pt-10">
        {/* Encabezado del módulo */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/90 bg-white/80 px-6 py-8 shadow-[0_18px_55px_rgba(177,135,179,0.12)] backdrop-blur-md sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-[#F5D7EA]/70 blur-[75px]" />
          <div className="pointer-events-none absolute bottom-[-6rem] right-[24%] h-56 w-56 rounded-full bg-[#E4D9F8]/70 blur-[75px]" />

          <div className="relative">
            <Link
              href="/campus"
              className="inline-flex items-center gap-2 rounded-full border border-[#EBD6E9] bg-white/85 px-4 py-2 text-xs font-bold text-[#A45B91] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#FCEAF2]"
            >
              <span aria-hidden="true">←</span>
              Volver a mis módulos
            </Link>

            <div className="mt-7 flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-4xl">
                <p className="text-[10px] font-bold tracking-[0.22em] text-[#B16A9B]">
                  CAMPUS MR · RUTA DE APRENDIZAJE
                </p>
                <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-[#382B50] sm:text-4xl lg:text-5xl">
                  {modulo.titulo}
                </h1>
                {modulo.descripcion && (
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[#746780] sm:text-base">
                    {modulo.descripcion}
                  </p>
                )}
              </div>

              <div className="relative mx-auto flex h-24 w-24 shrink-0 items-center justify-center sm:mr-2 sm:h-32 sm:w-32">
                <div className="absolute inset-0 rounded-full bg-[#F3D9EC]/80 blur-2xl" />
                <img
                  src="/logo-material-didactico-mr.png"
                  alt="Material Didáctico MR"
                  className="relative z-10 h-full w-full object-contain drop-shadow-[0_8px_15px_rgba(155,94,142,0.18)]"
                />
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-2 text-xs font-semibold text-[#8F7D9D]">
              <span className="rounded-full bg-[#FCEAF2] px-3 py-2">🎥 Clases en video</span>
              <span className="rounded-full bg-[#F0E9FC] px-3 py-2">📄 Material de estudio</span>
              <span className="rounded-full bg-[#E7F5EF] px-3 py-2">✏️ Práctica del módulo</span>
            </div>
          </div>
        </section>

        {/* Clases */}
        <section className="mt-8 overflow-hidden rounded-[1.7rem] border border-[#F1DCEB] bg-white shadow-[0_12px_35px_rgba(177,135,179,0.09)]">
          <div className="flex items-center gap-4 border-b border-[#F3E5EF] bg-gradient-to-r from-[#FCE8F2] to-[#F8F3FC] px-6 py-5 sm:px-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              🎥
            </div>
            <div>
              <h2 className="text-xl font-black text-[#A94783] sm:text-2xl">
                Clases
              </h2>
              <p className="mt-1 text-xs text-[#927F9D]">
                Videos para acompañar tu aprendizaje
              </p>
            </div>
            <span className="ml-auto rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-[#A45B91]">
              {videos?.length || 0}
            </span>
          </div>

          <div className="space-y-8 p-5 sm:p-8">
            {videos && videos.length > 0 ? (
              videos.map((video: any, indice: number) => (
                <article
                  key={video.id}
                  className="overflow-hidden rounded-2xl border border-[#EEE5F0] bg-[#FFFCFE] p-4 sm:p-5"
                >
                  <div className="mb-4 flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FCE8F2] text-xs font-black text-[#B84786]">
                      {String(indice + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-base font-extrabold leading-snug text-[#59436D] sm:text-lg">
                        {video.titulo}
                      </h3>
                      <p className="mt-1 text-xs text-[#9A8AA3]">
                        Clase en video
                      </p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl bg-[#211A2A] shadow-sm">
                    <iframe
                      src={obtenerYoutubeEmbed(video.youtube_url)}
                      title={video.titulo}
                      className="aspect-video w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#E6D9E9] bg-[#FFFCFE] px-5 py-10 text-center">
                <div className="text-3xl">🎥</div>
                <p className="mt-3 text-sm font-semibold text-[#766783]">
                  No hay clases disponibles por el momento.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Material de estudio */}
        <section className="mt-8 overflow-hidden rounded-[1.7rem] border border-[#E4DCF3] bg-white shadow-[0_12px_35px_rgba(177,135,179,0.09)]">
          <div className="flex items-center gap-4 border-b border-[#EEE8F7] bg-gradient-to-r from-[#EEE8FC] to-[#F8F5FF] px-6 py-5 sm:px-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              📄
            </div>
            <div>
              <h2 className="text-xl font-black text-[#7958A7] sm:text-2xl">
                Material de estudio
              </h2>
              <p className="mt-1 text-xs text-[#927F9D]">
                Documentos para consultar y repasar
              </p>
            </div>
            <span className="ml-auto rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-[#7958A7]">
              {pdfs?.length || 0}
            </span>
          </div>

          <div className="space-y-3 p-5 sm:p-8">
            {pdfs && pdfs.length > 0 ? (
              pdfs.map((pdf: any, indice: number) => (
                <article
                  key={pdf.id}
                  className="flex flex-col gap-4 rounded-2xl border border-[#EEE8F7] bg-[#FFFCFE] p-4 transition hover:border-[#DCCCF0] hover:shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0E9FC] text-xl">
                      📑
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[#59436D]">
                        {pdf.titulo}
                      </h3>
                      <p className="mt-1 text-xs text-[#9A8AA3]">
                        Documento PDF · Recurso {indice + 1}
                      </p>
                    </div>
                  </div>

                  <a
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8061B0] to-[#A27BCB] px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    Abrir material <span aria-hidden="true">↗</span>
                  </a>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#E6D9E9] bg-[#FFFCFE] px-5 py-10 text-center">
                <div className="text-3xl">📄</div>
                <p className="mt-3 text-sm font-semibold text-[#766783]">
                  No hay material de estudio disponible por el momento.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Material complementario */}
        <section className="mt-8 overflow-hidden rounded-[1.7rem] border border-[#DCEDE5] bg-white shadow-[0_12px_35px_rgba(177,135,179,0.09)]">
          <div className="flex items-center gap-4 border-b border-[#E4F1EA] bg-gradient-to-r from-[#E7F5EF] to-[#F5FBF8] px-6 py-5 sm:px-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              📚
            </div>
            <div>
              <h2 className="text-xl font-black text-[#39866D] sm:text-2xl">
                Material complementario
              </h2>
              <p className="mt-1 text-xs text-[#927F9D]">
                Recursos adicionales de apoyo
              </p>
            </div>
            <span className="ml-auto rounded-full bg-white/80 px-3 py-1.5 text-xs font-bold text-[#39866D]">
              {recursos?.length || 0}
            </span>
          </div>

          <div className="space-y-3 p-5 sm:p-8">
            {recursos && recursos.length > 0 ? (
              recursos.map((recurso: any, indice: number) => (
                <article
                  key={recurso.id}
                  className="flex flex-col gap-4 rounded-2xl border border-[#E4F1EA] bg-[#FFFCFE] p-4 transition hover:border-[#CDE7D9] hover:shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E7F5EF] text-xl">
                      📎
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[#59436D]">
                        {recurso.titulo}
                      </h3>
                      <p className="mt-1 text-xs text-[#9A8AA3]">
                        {recurso.tipo || "Recurso complementario"} · Recurso {indice + 1}
                      </p>
                    </div>
                  </div>

                  <a
                    href={recurso.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#459B7B] to-[#69B69A] px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    Abrir recurso <span aria-hidden="true">↗</span>
                  </a>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#D7EADF] bg-[#FFFCFE] px-5 py-10 text-center">
                <div className="text-3xl">📚</div>
                <p className="mt-3 text-sm font-semibold text-[#766783]">
                  No hay material complementario disponible por el momento.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Práctica */}
        <section className="mt-8 overflow-hidden rounded-[1.7rem] border border-[#F2E4C8] bg-white shadow-[0_12px_35px_rgba(177,135,179,0.09)]">
          <div className="flex items-center gap-4 border-b border-[#F5EBD7] bg-gradient-to-r from-[#FFF3D9] to-[#FFFAEF] px-6 py-5 sm:px-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              ✏️
            </div>
            <div>
              <h2 className="text-xl font-black text-[#A8781D] sm:text-2xl">
                Práctica del módulo
              </h2>
              <p className="mt-1 text-xs text-[#927F9D]">
                Refuerza lo aprendido con preguntas
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="max-w-2xl">
              <h3 className="text-lg font-extrabold text-[#59436D]">
                ¿Listo para poner a prueba tus conocimientos?
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#81748D]">
                Refuerza tus conocimientos respondiendo las preguntas
                correspondientes a este módulo.
              </p>
            </div>

            <Link
              href={`/practica/${id}`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#B65BC0] to-[#D65B9B] px-8 py-4 text-sm font-extrabold text-white shadow-md shadow-[#D8B6DF]/30 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Comenzar práctica <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <div className="mt-10 text-center">
          <Link
            href="/campus"
            className="inline-flex items-center gap-2 rounded-full border border-[#EBD6E9] bg-white/80 px-5 py-3 text-xs font-bold text-[#A45B91] shadow-sm transition hover:bg-[#FCEAF2]"
          >
            ← Volver a todos los módulos
          </Link>
        </div>
      </div>
    </main>
  );
}
