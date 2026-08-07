import Link from "next/link";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-5xl font-bold text-black">
          Material Didáctico MR Academy
        </h1>

        <p className="mt-6 text-xl text-gray-600 max-w-2xl">
          Prepárate con confianza para la Prueba de Comprobación de la
          Idoneidad Docente de Costa Rica.
        </p>

        <Link
          href="/campus"
          className="mt-10 bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-xl transition"
        >
          Comenzar ahora
        </Link>
      </main>
    </>
  );
}