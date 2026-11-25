import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function CampusPage() {
  const { data: modulos, error } = await supabase
    .from("modulos")
    .select("*")
    .eq("activo", true)
    .order("orden");

  const estadisticas = [
    {
      icono: "📘",
      valor: modulos?.length || 0,
      etiqueta: "Módulos",
      detalle: "Rutas de aprendizaje",
      fondo: "bg-[#FCE8F2]",
      acento: "text-[#C34F91]",
    },
    {
      icono: "🎥",
      valor: "Videos",
      etiqueta: "Clases disponibles",
      detalle: "Aprende a tu ritmo",
      fondo: "bg-[#EEE8FC]",
      acento: "text-[#8061B0]",
    },
    {
      icono: "📄",
      valor: "PDFs",
      etiqueta: "Material de estudio",
      detalle: "Recursos de consulta",
      fondo: "bg-[#E7F5EF]",
      acento: "text-[#398B70]",
    },
    {
      icono: "📝",
      valor: "Práctica",
      etiqueta: "Banco de preguntas",
      detalle: "Pon a prueba lo aprendido",
      fondo: "bg-[#FFF3D9]",
      acento: "text-[#B78322]",
    },
  ];

  const coloresModulos = [
    {
      fondo: "from-[#FCE8F2] to-[#F9F1FA]",
      borde: "border-[#F3D5E6]",
      acento: "text-[#B84786]",
      boton: "from-[#B65BC0] to-[#D65B9B]",
      numero: "01",
    },
    {
      fondo: "from-[#EEE8FC] to-[#F8F5FF]",
      borde: "border-[#E1D7F4]",
      acento: "text-[#7958A7]",
      boton: "from-[#8061B0] to-[#A27BCB]",
      numero: "02",
    },
    {
      fondo: "from-[#E7F5EF] to-[#F5FBF8]",
      borde: "border-[#D5EDE2]",
      acento: "text-[#39866D]",
      boton: "from-[#459B7B] to-[#69B69A]",
      numero: "03",
    },
    {
      fondo: "from-[#FFF3D9] to-[#FFFAEF]",
      borde: "border-[#F5E7C5]",
      acento: "text-[#A8781D]",
      boton: "from-[#C28A2D] to-[#D9AA55]",
      numero: "04",
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FFF9FC] text-[#49375E]">
      {/* Iluminación ambiental de la identidad MR */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-[#EADCFB]/70 blur-[100px]" />
      <div className="pointer-events-none absolute -left-40 top-[34rem] h-[30rem] w-[30rem] rounded-full bg-[#F8DCEB]/70 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[24rem] w-[24rem] rounded-full bg-[#E8E0FA]/50 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        {/* Hero */}
        <section className="relative mt-8 overflow-hidden rounded-[2rem] border border-white/90 bg-white/75 px-6 py-8 shadow-[0_18px_60px_rgba(177,135,179,0.12)] backdrop-blur-md sm:mt-10 sm:px-10 sm:py-10 lg:px-12">
          <div className="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full bg-[#F5D7EA]/70 blur-[70px]" />
          <div className="pointer-events-none absolute bottom-[-7rem] right-[28%] h-64 w-64 rounded-full bg-[#E4D9F8]/70 blur-[70px]" />

          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#EBD6E9] bg-white/85 px-4 py-2 text-[10px] font-bold tracking-[0.13em] text-[#A45B91] shadow-sm">
                <span>🌷</span>
                PREPARACIÓN PARA LA IDONEIDAD DOCENTE
              </div>

              <h1 className="text-3xl font-black leading-tight tracking-tight text-[#382B50] sm:text-4xl lg:text-5xl">
                Tu camino hacia la
                <span className="block bg-gradient-to-r from-[#A95AC0] to-[#D45C9C] bg-clip-text text-transparent">
                  idoneidad docente
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#746780] sm:text-base">
                Prepárate para la Prueba Nacional de Idoneidad Docente con
                clases, materiales de estudio y prácticas organizadas por
                módulos. Avanza a tu ritmo y fortalece tus conocimientos.
              </p>

              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-[#8F7D9D]">
                <span className="rounded-full bg-[#FCEAF2] px-3 py-2">✓ Recursos de estudio</span>
                <span className="rounded-full bg-[#F0E9FC] px-3 py-2">✓ Clases y videos</span>
                <span className="rounded-full bg-[#E7F5EF] px-3 py-2">✓ Prácticas interactivas</span>
              </div>
            </div>

            <div className="relative mx-auto flex w-full max-w-[13rem] items-center justify-center lg:mr-5 lg:max-w-[15rem]">
              <div className="absolute inset-0 rounded-full bg-[#F3D9EC]/80 blur-3xl" />
              <div className="absolute inset-5 rounded-full bg-[#E9DFFA]/70 blur-2xl" />
              <img
                src="/logo-material-didactico-mr.png"
                alt="Material Didáctico MR"
                className="relative z-10 w-full object-contain drop-shadow-[0_14px_24px_rgba(155,94,142,0.20)]"
              />
            </div>
          </div>
        </section>

        {/* Indicadores */}
        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {estadisticas.map((item) => (
            <article
              key={item.etiqueta}
              className="group rounded-2xl border border-white bg-white/90 p-5 shadow-[0_8px_28px_rgba(177,135,179,0.09)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(177,135,179,0.15)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={`text-2xl font-black ${item.acento}`}>
                    {item.valor}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#59436D]">
                    {item.etiqueta}
                  </p>
                  <p className="mt-1 text-xs text-[#95859E]">{item.detalle}</p>
                </div>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.fondo} text-2xl transition group-hover:scale-105`}>
                  {item.icono}
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Módulos */}
        <section className="pt-14">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-[0.22em] text-[#B16A9B]">
                TU RUTA DE APRENDIZAJE
              </p>
              <h2 className="mt-2 text-2xl font-black text-[#49375E] sm:text-3xl">
                Mis módulos
              </h2>
              <p className="mt-2 text-sm text-[#91849D]">
                Selecciona un módulo para continuar tu preparación.
              </p>
            </div>
            <span className="rounded-full border border-[#EBDCEC] bg-white/80 px-4 py-2 text-xs font-semibold text-[#8D789B]">
              {modulos?.length || 0} módulos disponibles
            </span>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              No fue posible cargar los módulos. Intenta actualizar la página.
            </div>
          )}

          {!modulos || modulos.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#DDCDE2] bg-white/80 px-6 py-14 text-center">
              <div className="text-4xl">📚</div>
              <h3 className="mt-4 text-lg font-bold text-[#59436D]">
                Aún no hay módulos disponibles
              </h3>
              <p className="mt-2 text-sm text-[#95859E]">
                Cuando se habiliten los módulos, aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {modulos.map((modulo: any, indice: number) => {
                const estilo = coloresModulos[indice % coloresModulos.length];

                return (
                  <article
                    key={modulo.id}
                    className={`group relative overflow-hidden rounded-[1.7rem] border ${estilo.borde} bg-white shadow-[0_12px_35px_rgba(177,135,179,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(177,135,179,0.17)]`}
                  >
                    <div className={`h-2 bg-gradient-to-r ${estilo.boton}`} />
                    <div className="p-6 sm:p-8">
                      <div className="flex items-start justify-between gap-4">
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${estilo.fondo} text-2xl shadow-sm`}>
                          📖
                        </div>
                        <span className={`rounded-full bg-gradient-to-br ${estilo.fondo} px-3 py-1.5 text-[10px] font-extrabold tracking-[0.12em] ${estilo.acento}`}>
                          MÓDULO {estilo.numero}
                        </span>
                      </div>

                      <h3 className={`mt-6 text-xl font-black leading-snug ${estilo.acento} sm:text-2xl`}>
                        {modulo.titulo}
                      </h3>

                      <p className="mt-3 min-h-[3.5rem] text-sm leading-7 text-[#81748D]">
                        {modulo.descripcion || "Explora los contenidos y actividades de este módulo."}
                      </p>

                      <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="rounded-xl bg-[#F8F5FA] px-2 py-3 text-center">
                          <span className="text-xl">🎥</span>
                          <p className="mt-1 text-[11px] font-bold text-[#776783]">Clases</p>
                        </div>
                        <div className="rounded-xl bg-[#F8F5FA] px-2 py-3 text-center">
                          <span className="text-xl">📄</span>
                          <p className="mt-1 text-[11px] font-bold text-[#776783]">Material</p>
                        </div>
                        <div className="rounded-xl bg-[#F8F5FA] px-2 py-3 text-center">
                          <span className="text-xl">✏️</span>
                          <p className="mt-1 text-[11px] font-bold text-[#776783]">Práctica</p>
                        </div>
                      </div>

                      <Link
                        href={`/campus/${modulo.id}`}
                        className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${estilo.boton} px-5 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg`}
                      >
                        Continuar
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
