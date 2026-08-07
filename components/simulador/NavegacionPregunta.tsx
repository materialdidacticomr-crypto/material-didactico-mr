"use client";

interface Props {
  actual: number;
  total: number;
  puedeContinuar: boolean;
  onAnterior: () => void;
  onSiguiente: () => void;
  onFinalizar: () => void;
}

export default function NavegacionPregunta({
  actual,
  total,
  puedeContinuar,
  onAnterior,
  onSiguiente,
  onFinalizar,
}: Props) {

  const ultimaPregunta = actual === total - 1;

  return (

    <div className="flex justify-between mt-10">

      <button
        onClick={onAnterior}
        disabled={actual === 0}
        className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-8 py-3 rounded-xl font-bold"
      >
        ← Anterior
      </button>

      {!ultimaPregunta ? (

        <button
          onClick={onSiguiente}
          disabled={!puedeContinuar}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-8 py-3 rounded-xl font-bold"
        >
          Siguiente →
        </button>

      ) : (

        <button
          onClick={onFinalizar}
          disabled={!puedeContinuar}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-8 py-3 rounded-xl font-bold"
        >
          Finalizar Examen
        </button>

      )}

    </div>

  );

}