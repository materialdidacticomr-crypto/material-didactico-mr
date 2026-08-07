import Link from "next/link";
import PdfForm from "@/components/pdfs/PdfForm";
import PdfList from "@/components/pdfs/PdfList";

export default function PdfsAdmin() {
  return (
    <main className="min-h-screen bg-gray-100 p-10">

      <Link
        href="/admin"
        className="text-red-600 font-semibold"
      >
        ← Volver al panel
      </Link>

      <h1 className="text-4xl font-bold text-red-600 mt-6 mb-10">
        Administrador de PDFs
      </h1>

      <PdfForm />

      <PdfList />

    </main>
  );
}