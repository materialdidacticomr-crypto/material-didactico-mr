import Link from "next/link";

export default function AdminPage() {
  const tarjetas = [
    {
      titulo: "Usuarios",
      descripcion: "Administrar usuarios del sistema.",
      icono: "👥",
      ruta: "/admin/usuarios",
      color: "bg-blue-600",
    },
    {
      titulo: "Módulos",
      descripcion: "Administrar módulos del curso.",
      icono: "📚",
      ruta: "/admin/modulos",
      color: "bg-purple-600",
    },
    {
      titulo: "Videos",
      descripcion: "Administrar videos.",
      icono: "🎥",
      ruta: "/admin/videos",
      color: "bg-red-600",
    },
    {
      titulo: "PDFs",
      descripcion: "Administrar documentos PDF.",
      icono: "📄",
      ruta: "/admin/pdfs",
      color: "bg-indigo-600",
    },
    {
      titulo: "Recursos",
      descripcion: "Administrar material complementario.",
      icono: "📚",
      ruta: "/admin/recursos",
      color: "bg-green-600",
    },
    {
      titulo: "Preguntas",
      descripcion: "Banco de preguntas.",
      icono: "📝",
      ruta: "/admin/preguntas",
      color: "bg-orange-500",
    },
    {
      titulo: "Estadísticas",
      descripcion: "Ver estadísticas generales.",
      icono: "📊",
      ruta: "/admin/estadisticas",
      color: "bg-cyan-600",
    },
    {
      titulo: "Configuración",
      descripcion: "Configurar la plataforma.",
      icono: "⚙️",
      ruta: "/admin/configuracion",
      color: "bg-gray-700",
    },
  ];

  return (
    <main>

      <div className="mb-10">

        <h1 className="text-4xl font-bold text-gray-800">
          Bienvenido al Panel de Administración
        </h1>

        <p className="text-gray-500 mt-2 text-lg">
          Administre todo el contenido de Material Didáctico MR Academy desde un solo lugar.
        </p>

      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

        {tarjetas.map((tarjeta) => (

          <Link
            key={tarjeta.ruta}
            href={tarjeta.ruta}
            className="bg-white rounded-2xl shadow hover:shadow-xl transition overflow-hidden"
          >

            <div className={`${tarjeta.color} h-3`} />

            <div className="p-6">

              <div className="text-5xl mb-5">
                {tarjeta.icono}
              </div>

              <h2 className="text-2xl font-bold text-gray-800">
                {tarjeta.titulo}
              </h2>

              <p className="text-gray-500 mt-3">
                {tarjeta.descripcion}
              </p>

            </div>

          </Link>

        ))}

      </div>

    </main>
  );
}