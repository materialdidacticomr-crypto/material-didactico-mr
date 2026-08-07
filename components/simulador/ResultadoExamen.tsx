"use client";

interface Props {
  total: number;
  correctas: number;
  onReiniciar: () => void;
}

export default function ResultadoExamen({
  total,
  correctas,
  onReiniciar,
}: Props) {

  const incorrectas = total - correctas;

  const porcentaje =
    total > 0
      ? Math.round((correctas / total) * 100)
      : 0;

  const aprobado = porcentaje >= 70;

  return (

    <div className="max-w-3xl mx-auto">

      <div className="bg-white rounded-2xl shadow-xl p-10">

        <h1 className="text-4xl font-bold text-center text-red-600 mb-10">
          Resultado del Simulador
        </h1>

        <div className="grid md:grid-cols-3 gap-6 mb-10">

          <div className="bg-green-100 rounded-xl p-6 text-center">

            <div className="text-5xl font-bold text-green-700">
              {correctas}
            </div>

            <p className="mt-3 font-semibold">
              Correctas
            </p>

          </div>

          <div className="bg-red-100 rounded-xl p-6 text-center">

            <div className="text-5xl font-bold text-red-700">
              {incorrectas}
            </div>

            <p className="mt-3 font-semibold">
              Incorrectas
            </p>

          </div>

          <div className="bg-blue-100 rounded-xl p-6 text-center">

            <div className="text-5xl font-bold text-blue-700">
              {porcentaje}%
            </div>

            <p className="mt-3 font-semibold">
              Calificación
            </p>

          </div>

        </div>

        <div
          className={`rounded-xl p-6 text-center text-2xl font-bold mb-10 ${
            aprobado
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {aprobado ? "🎉 APROBADO" : "📚 CONTINÚA ESTUDIANDO"}
        </div>

        <div className="text-center">

          <button
            onClick={onReiniciar}
            className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-xl font-bold text-lg"
          >
            Volver al Simulador
          </button>

        </div>

      </div>

    </div>

  );

}