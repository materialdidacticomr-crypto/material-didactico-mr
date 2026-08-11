export default function ModulosAdmin() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">
          📚 Módulos
        </h1>

        <p className="text-gray-500 mt-2">
          Administra los módulos del curso de Material Didáctico MR Academy.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Módulos del curso
            </h2>

            <p className="text-gray-500 mt-1">
              Próximamente podrás crear, editar y organizar los módulos.
            </p>
          </div>

          <button
            type="button"
            className="bg-purple-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-purple-700 transition"
          >
            + Nuevo módulo
          </button>
        </div>

        <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
          <div className="text-5xl mb-4">📚</div>

          <h3 className="text-xl font-bold text-gray-700">
            Aún no hay módulos
          </h3>

          <p className="text-gray-500 mt-2">
            Aquí aparecerán los módulos de la academia.
          </p>
        </div>
      </div>
    </div>
  );
}