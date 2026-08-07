"use client";

interface Props {
  actual: number;
  total: number;
}

export default function BarraProgreso({
  actual,
  total,
}: Props) {

  const porcentaje =
    total > 0
      ? ((actual + 1) / total) * 100
      : 0;

  return (

    <div className="mb-8">

      <div className="flex justify-between items-center mb-3">

        <span className="font-semibold text-gray-700">
          Pregunta {actual + 1} de {total}
        </span>

        <span className="font-bold text-red-600">
          {Math.round(porcentaje)}%
        </span>

      </div>

      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">

        <div
          className="h-full bg-red-600 transition-all duration-500"
          style={{
            width: `${porcentaje}%`,
          }}
        />

      </div>

    </div>

  );

}