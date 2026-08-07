import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-10">

      <h1 className="text-4xl font-bold text-red-600">
        Bienvenido a MR Academy
      </h1>

      <p className="text-gray-600 mt-2 mb-10">
        Seleccione una opción para continuar.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        <Link
          href="/cursos"
          className="bg-white shadow-lg rounded-xl p-8 text-center hover:shadow-xl"
        >
          <h2 className="text-2xl font-bold">
            📚
          </h2>

          <p className="mt-4 font-semibold">
            Mi Preparación
          </p>
        </Link>

        <Link
          href="/banco"
          className="bg-white shadow-lg rounded-xl p-8 text-center hover:shadow-xl"
        >
          <h2 className="text-2xl font-bold">
            📝
          </h2>

          <p className="mt-4 font-semibold">
            Banco de Preguntas
          </p>
        </Link>

        <Link
          href="/simuladores"
          className="bg-white shadow-lg rounded-xl p-8 text-center hover:shadow-xl"
        >
          <h2 className="text-2xl font-bold">
            🎯
          </h2>

          <p className="mt-4 font-semibold">
            Simuladores
          </p>
        </Link>

        <Link
          href="/perfil"
          className="bg-white shadow-lg rounded-xl p-8 text-center hover:shadow-xl"
        >
          <h2 className="text-2xl font-bold">
            👤
          </h2>

          <p className="mt-4 font-semibold">
            Mi Perfil
          </p>
        </Link>

      </div>

    </main>
  );
}