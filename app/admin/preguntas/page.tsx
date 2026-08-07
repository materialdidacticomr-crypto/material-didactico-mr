import Link from "next/link";
import PreguntaForm from "@/components/preguntas/PreguntaForm";
import PreguntaList from "@/components/preguntas/PreguntaList";

export default function PreguntasAdmin() {

  return (

    <main className="min-h-screen bg-gray-100 p-10">

      <Link
        href="/admin"
        className="text-red-600 font-semibold"
      >
        ← Volver al panel
      </Link>

      <h1 className="text-4xl font-bold text-red-600 mt-6 mb-10">
        Banco de Preguntas
      </h1>

      <PreguntaForm />

      <PreguntaList />

    </main>

  );

}