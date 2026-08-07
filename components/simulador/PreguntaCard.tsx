"use client";

interface Pregunta {
  id: string;
  pregunta: string;
  opcion_a: string;
  opcion_b: string;
  opcion_c: string;
  opcion_d: string;
}

interface Props {
  pregunta: Pregunta;
  numero: number;
  total: number;
  respuesta: string;
  onResponder: (respuesta: string) => void;
}

export default function PreguntaCard({
  pregunta,
  numero,
  total,
  respuesta,
  onResponder,
}: Props) {

  const porcentaje = ((numero + 1) / total) * 100;

  return (

    <div className="bg-white rounded-2xl shadow-xl p-8">

      <div className="mb-8">

        <div className="flex justify-between mb-3">

          <span className="font-semibold">
            Pregunta {numero + 1} de {total}
          </span>

          <span className="font-bold text-red-600">
            {Math.round(porcentaje)}%
          </span>

        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">

          <div
            className="bg-red-600 h-3 rounded-full transition-all"
            style={{
              width: `${porcentaje}%`,
            }}
          />

        </div>

      </div>

      <h2 className="text-2xl font-bold mb-8">
        {pregunta.pregunta}
      </h2>

      <div className="space-y-4">

        {[
          { letra: "A", texto: pregunta.opcion_a },
          { letra: "B", texto: pregunta.opcion_b },
          { letra: "C", texto: pregunta.opcion_c },
          { letra: "D", texto: pregunta.opcion_d },
        ].map((opcion) => (

          <button
            key={opcion.letra}
            onClick={() => onResponder(opcion.letra)}
            className={`w-full text-left border rounded-xl p-5 transition
              ${
                respuesta === opcion.letra
                  ? "bg-red-600 text-white border-red-600"
                  : "hover:bg-gray-100"
              }`}
          >

            <strong>{opcion.letra}.</strong>{" "}
            {opcion.texto}

          </button>

        ))}

      </div>

    </div>

  );

}