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
    <div className={lato.className}>

      <main className="relative min-h-screen overflow-hidden bg-white">

        {/* =========================
            LOGO COMO MARCA DE AGUA
        ========================== */}

        <div
          className="
            absolute
            inset-0
            flex
            items-center
            justify-center
            pointer-events-none
            select-none
          "
          aria-hidden="true"
        >
          <img
            src="/logo-material-didactico-mr.png"
            alt=""
            className="
              w-[650px]
              max-w-[85vw]
              opacity-[0.045]
            "
          />
        </div>

        {/* =========================
            DECORACIÓN SUPERIOR IZQUIERDA
        ========================== */}

        <div
          className="
            absolute
            top-24
            left-7
            sm:left-10
            w-32
            h-32
            opacity-30
            pointer-events-none
          "
          aria-hidden="true"
        >
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 25 }).map((_, index) => (
              <span
                key={index}
                className="w-1.5 h-1.5 rounded-full bg-red-500"
              />
            ))}
          </div>
        </div>

        {/* =========================
            DECORACIÓN INFERIOR DERECHA
        ========================== */}

        <div
          className="
            absolute
            bottom-24
            right-7
            sm:right-10
            w-32
            h-32
            opacity-30
            pointer-events-none
          "
          aria-hidden="true"
        >
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: 25 }).map((_, index) => (
              <span
                key={index}
                className="w-1.5 h-1.5 rounded-full bg-red-500"
              />
            ))}
          </div>
        </div>

        {/* =========================
            BRILLOS DE FONDO
        ========================== */}

        <div
          className="
            absolute
            -bottom-48
            -left-48
            w-[600px]
            h-[600px]
            rounded-full
            bg-red-600
            opacity-[0.08]
            blur-3xl
            pointer-events-none
          "
        />

        <div
          className="
            absolute
            -top-48
            -right-48
            w-[500px]
            h-[500px]
            rounded-full
            bg-red-500
            opacity-[0.045]
            blur-3xl
            pointer-events-none
          "
        />

        {/* =========================
            CONTENIDO PRINCIPAL
        ========================== */}

        <section
          className="
            relative
            z-10
            min-h-screen
            flex
            flex-col
            items-center
            justify-center
            text-center
            px-5
            sm:px-8
            py-16
          "
        >

          <div className="max-w-7xl w-full">

            {/* =========================
                MARCA
            ========================== */}

            <div className={poppins.className}>

              <h1 className="font-semibold tracking-tight">

                <span
                  className="
                    block
                    text-4xl
                    sm:text-5xl
                    md:text-6xl
                    lg:text-7xl
                    xl:text-8xl
                    leading-tight
                    text-gray-900
                  "
                >
                  MATERIAL DIDÁCTICO{" "}
                  <span className="text-red-600">
                    MR
                  </span>
                </span>

                <span
                  className="
                    block
                    mt-3
                    text-lg
                    sm:text-xl
                    md:text-2xl
                    lg:text-3xl
                    tracking-[0.65em]
                    text-gray-500
                    font-medium
                  "
                >
                  ACADEMY
                </span>

              </h1>

            </div>

            {/* =========================
                DETALLE DE MARCA
            ========================== */}

            <div className="flex items-center justify-center gap-4 mt-8">

              <div className="h-px w-16 sm:w-24 bg-red-500" />

              <div className="w-2 h-2 rounded-full bg-red-600" />

              <div className="h-px w-16 sm:w-24 bg-red-500" />

            </div>

            {/* =========================
                DESCRIPCIÓN
            ========================== */}

            <p
              className="
                mt-9
                text-lg
                sm:text-xl
                md:text-2xl
                text-gray-600
                max-w-3xl
                mx-auto
                leading-relaxed
              "
            >
              Prepárate con confianza para la{" "}
              <span className="font-bold text-red-600">
                Prueba de Comprobación de la Idoneidad Docente
              </span>{" "}
              de Costa Rica.
            </p>

            {/* =========================
                BOTÓN INICIAR
            ========================== */}

            <Link
              href="/login"
              className="
                inline-flex
                items-center
                justify-center
                mt-11
                bg-red-600
                hover:bg-red-700
                text-white
                font-bold
                text-lg
                px-12
                py-4
                rounded-2xl
                shadow-lg
                shadow-red-200
                hover:shadow-xl
                hover:-translate-y-1
                transition-all
                duration-300
              "
            >
              Iniciar
            </Link>

          </div>

          {/* =========================
              BENEFICIOS
          ========================== */}

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-4
              gap-5
              max-w-7xl
              w-full
              mt-20
            "
          >

            <Tarjeta
              titulo="Contenido actualizado"
              descripcion="Material orientado a los lineamientos oficiales del MEP."
              icono="📖"
            />

            <Tarjeta
              titulo="Práctica efectiva"
              descripcion="Preguntas diseñadas para fortalecer tu preparación."
              icono="🎯"
            />

            <Tarjeta
              titulo="Seguimiento"
              descripcion="Conoce tu avance y observa tu progreso."
              icono="📈"
            />

            <Tarjeta
              titulo="Confianza"
              descripcion="Prepárate con tranquilidad y alcanza tu meta."
              icono="🛡️"
            />

          </div>

        </section>

      </main>

    </div>
  );
}


/* =================================
   TARJETA DE BENEFICIO
================================= */

function Tarjeta({
  titulo,
  descripcion,
  icono,
}: {
  titulo: string;
  descripcion: string;
  icono: string;
}) {
  return (
    <div
      className="
        bg-white/95
        backdrop-blur-sm
        border
        border-gray-100
        rounded-2xl
        p-6
        text-left
        shadow-md
        hover:shadow-xl
        hover:-translate-y-1
        transition-all
        duration-300
      "
    >

      <div
        className="
          w-14
          h-14
          rounded-full
          bg-red-50
          flex
          items-center
          justify-center
          text-2xl
          mb-5
        "
      >
        {icono}
      </div>

      <h2
        className={`${poppins.className} text-xl font-semibold text-gray-900`}
      >
        {titulo}
      </h2>

      <p className="mt-2 text-gray-600 leading-relaxed">
        {descripcion}
      </p>

    </div>
  );
}