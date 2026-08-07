import Link from "next/link";

export default function AdminPage() {

  return (

    <main className="min-h-screen bg-gray-100 p-10">

      <h1 className="text-5xl font-bold text-red-600 mb-3">
        Material Didáctico MR
      </h1>

      <p className="text-gray-600 text-xl mb-10">
        Panel de Administración del Campus
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

        <Link
          href="/admin/videos"
          className="bg-white rounded-xl shadow hover:shadow-xl transition p-8"
        >
          <h2 className="text-3xl font-bold mb-3">
            🎥 Videos
          </h2>

          <p className="text-gray-600">
            Administrar videos.
          </p>

        </Link>

        <Link
          href="/admin/pdfs"
          className="bg-white rounded-xl shadow hover:shadow-xl transition p-8"
        >
          <h2 className="text-3xl font-bold mb-3">
            📄 PDFs
          </h2>

          <p className="text-gray-600">
            Administrar documentos.
          </p>

        </Link>

        <Link
          href="/admin/recursos"
          className="bg-white rounded-xl shadow hover:shadow-xl transition p-8"
        >
          <h2 className="text-3xl font-bold mb-3">
            📚 Recursos
          </h2>

          <p className="text-gray-600">
            Administrar archivos.
          </p>

        </Link>

        <Link
          href="/admin/preguntas"
          className="bg-white rounded-xl shadow hover:shadow-xl transition p-8"
        >
          <h2 className="text-3xl font-bold mb-3">
            📝 Preguntas
          </h2>

          <p className="text-gray-600">
            Banco de preguntas.
          </p>

        </Link>

      </div>

    </main>

  );

}