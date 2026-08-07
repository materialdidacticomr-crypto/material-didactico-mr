import Link from "next/link";

export default function Navbar() {
  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">

        <Link
          href="/"
          className="text-2xl font-bold text-red-600"
        >
          Material Didáctico MR
        </Link>

        <nav className="hidden md:flex gap-8 text-gray-700 font-medium">

          <Link href="/">Inicio</Link>

          <Link href="/campus">Campus</Link>

          <Link href="/banco">Banco</Link>

          <Link href="/simulador">Simulador</Link>

          <Link href="/perfil">Perfil</Link>

        </nav>

        <Link
          href="/login"
          className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition"
        >
          Ingresar
        </Link>

      </div>
    </header>
  );
}