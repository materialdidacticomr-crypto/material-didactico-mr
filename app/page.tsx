
import Link from "next/link";
import { Poppins, Lato } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export default function Home() {
  return (
    <div className={`${lato.className} min-h-screen bg-[#FFF9FC]`}>
      <main className="relative min-h-screen overflow-hidden">

        {/* DECORACIÓN DE FONDO */}
        <div className="pointer-events-none absolute -top-40 -right-32 h-[500px] w-[500px] rounded-full bg-[#EADCFB] opacity-60 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 -left-32 h-[500px] w-[500px] rounded-full bg-[#F8DCEB] opacity-70 blur-3xl" />

        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FCEAF2] opacity-50 blur-3xl" />

        {/* CONTENIDO */}
        <section className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center px-5 py-10 sm:px-8 sm:py-14">

          {/* ENCABEZADO */}
          <header className="flex w-full items-center justify-between gap-4">

            <div className="flex items-center gap-3">
              <img
                src="/logo-material-didactico-mr.png"
                alt="Material Didáctico MR"
                className="h-16 w-16 rounded-2xl bg-white object-contain p-1 shadow-md sm:h-20 sm:w-20"
              />

              <div>
                <h2 className={`${poppins.className} text-lg font-bold leading-tight text-[#45345F] sm:text-xl`}>
                  Material Didáctico
                  <span className="ml-1 text-[#D65B9B]">MR</span>
                </h2>
                <p className="text-xs font-semibold tracking-[0.22em] text-[#927CA9]">
                  ACADEMY
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="rounded-full border border-[#E8CBE0] bg-white/80 px-5 py-2.5 text-sm font-bold text-[#80518C] shadow-sm transition hover:bg-[#F9E8F3] sm:px-7"
            >
              Iniciar sesión
            </Link>
          </header>

          {/* PRESENTACIÓN PRINCIPAL */}
          <div className="my-auto grid w-full items-center gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">

            {/* TEXTO */}
            <div className="text-center lg:text-left">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#EBD6E9] bg-white/80 px-4 py-2 text-xs font-bold tracking-wide text-[#A45B91] shadow-sm">
                <span>🌷</span>
                CAMPUS MR 2.0 · ESPACIO DE APRENDIZAJE
              </div>

              <h1 className={`${poppins.className} text-4xl font-bold leading-tight tracking-tight text-[#382B50] sm:text-5xl lg:text-6xl`}>
                Aprendé,
                <span className="block text-[#D45C9C]">
                  preparate
                </span>
                y alcanzá tus metas.
              </h1>

              <p className="mx-auto mt-7 max-w-xl text-base leading-8 text-[#746780] sm:text-lg lg:mx-0">
                Prepárate con confianza para la{" "}
                <strong className="font-bold text-[#A64D91]">
                  Prueba de Comprobación de la Idoneidad Docente
                </strong>{" "}
                de Costa Rica.
              </p>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#91849D] lg:mx-0">
                Accedé a recursos educativos, prácticas y herramientas
                diseñadas para acompañarte en tu preparación.
              </p>

              <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">

                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#A95AC0] to-[#D45C9C] px-9 py-4 text-base font-bold text-white shadow-lg shadow-[#D8B6DF]/50 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  Ingresar al Campus
                  <span className="text-xl">→</span>
                </Link>

              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs font-semibold text-[#927CA9] lg:justify-start">
                <span>✓ Recursos educativos</span>
                <span>✓ Prácticas interactivas</span>
                <span>✓ Seguimiento</span>
              </div>
            </div>

            {/* PANEL VISUAL: LOGOTIPO OFICIAL MR */}
            <div className="relative mx-auto flex w-full max-w-xl items-center justify-center py-6 sm:py-8">
              {/* Iluminación ambiental rosa y lavanda */}
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F7D8EA]/80 blur-[70px]" />
              <div className="pointer-events-none absolute left-[18%] top-[18%] h-52 w-52 rounded-full bg-[#E5D9FA]/80 blur-[55px]" />
              <div className="pointer-events-none absolute bottom-[12%] right-[12%] h-48 w-48 rounded-full bg-[#F9E5EF]/90 blur-[55px]" />

              <div className="relative flex w-full flex-col items-center text-center">
                <div className="relative flex h-[min(88vw,30rem)] w-[min(88vw,30rem)] items-center justify-center sm:h-[31rem] sm:w-[31rem]">
                  <img
                    src="/logo-material-didactico-mr.png"
                    alt="Logotipo oficial de Material Didáctico MR"
                    className="relative z-10 h-[96%] w-[96%] object-contain drop-shadow-[0_18px_34px_rgba(196,105,164,0.28)]"
                  />
                </div>

                <div className="-mt-2 rounded-full border border-white/90 bg-white/75 px-6 py-3 shadow-[0_10px_35px_rgba(190,130,175,0.16)] backdrop-blur-md">
                  <p className={`${poppins.className} text-sm font-bold tracking-wide text-[#60436F] sm:text-base`}>
                    Material Didáctico MR
                  </p>
                  <p className="mt-1 text-[10px] font-semibold tracking-[0.28em] text-[#B06A9B]">
                    APRENDEMOS JUNTOS
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BENEFICIOS */}
          <div className="w-full pb-8">

            <div className="mb-8 text-center">
              <h2 className={`${poppins.className} text-2xl font-bold text-[#49375E] sm:text-3xl`}>
                Todo para avanzar con confianza
              </h2>
              <p className="mt-3 text-sm text-[#91849D]">
                Herramientas para acompañar tu preparación.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

              <Tarjeta
                titulo="Contenido actualizado"
                descripcion="Material orientado a los lineamientos oficiales del MEP."
                icono="📖"
                color="bg-[#FCEAF2]"
              />

              <Tarjeta
                titulo="Práctica efectiva"
                descripcion="Preguntas diseñadas para fortalecer tu preparación."
                icono="🎯"
                color="bg-[#F0E9FC]"
              />

              <Tarjeta
                titulo="Seguimiento"
                descripcion="Conocé tu avance y observá tu progreso."
                icono="📈"
                color="bg-[#E5F6EF]"
              />

              <Tarjeta
                titulo="Confianza"
                descripcion="Preparáte con tranquilidad y alcanzá tu meta."
                icono="🌟"
                color="bg-[#FFF4D9]"
              />

            </div>
          </div>

          {/* PIE */}
          <footer className="mt-8 w-full border-t border-[#EEDDEA] pt-6 text-center text-xs text-[#A292AD]">
            Material Didáctico MR · CAMPUS MR 2.0
            <p className="mt-2">
              Organizar · Aprender · Crecer
            </p>
          </footer>

        </section>
      </main>
    </div>
  );
}

function Tarjeta({
  titulo,
  descripcion,
  icono,
  color,
}: {
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white bg-white/90 p-6 shadow-md shadow-[#CDB9D5]/10 transition duration-300 hover:-translate-y-1 hover:shadow-xl">

      <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${color} text-2xl`}>
        {icono}
      </div>

      <h3 className={`${poppins.className} text-lg font-semibold text-[#49375E]`}>
        {titulo}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[#897B94]">
        {descripcion}
      </p>

    </div>
  );
}
