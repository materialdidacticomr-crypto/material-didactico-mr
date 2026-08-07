import Link from "next/link";
import RecursoForm from "@/components/recursos/RecursoForm";
import RecursoList from "@/components/recursos/RecursoList";

export default function RecursosAdmin() {

  return (

    <main className="min-h-screen bg-gray-100 p-10">

      <Link
        href="/admin"
        className="text-red-600 font-semibold"
      >
        ← Volver al panel
      </Link>

      <h1 className="text-4xl font-bold text-red-600 mt-6 mb-10">
        Administrador de Recursos
      </h1>

      <RecursoForm />

      <RecursoList />

    </main>

  );

}