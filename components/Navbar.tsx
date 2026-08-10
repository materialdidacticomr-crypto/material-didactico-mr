import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        <Link
          href="/"
          className="flex items-center gap-3 text-2xl font-bold text-red-600"
        >
          <img
            src="/logo-material-didactico-mr.png"
            alt="Material Didáctico MR"
            className="w-10 h-10 object-contain"
          />

          <span>
            Material Didáctico MR
          </span>
        </Link>

        <nav className="hidden md:flex gap-8 text-gray-700 font-medium">

          <Link
            href="/"
            className="hover:text-red-600 transition"
          >
            Inicio
          </Link>

          <Link
            href="/campus"
            className="hover:text-red-600 transition"
          >
            Campus
          </Link>

          <Link
            href="/banco"
            className="hover:text-red-600 transition"
          >
            Banco
          </Link>

          <Link
            href="/perfil"
            className="hover:text-red-600 transition"
          >
            Perfil
          </Link>

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