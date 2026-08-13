"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Intento {
  id: string;
  usuario_id: string;
  modulo_id: string;
  total_preguntas: number;
  respuestas_correctas: number;
  porcentaje: number;
  fecha: string;
  modulos?: {
    titulo: string;
  }[] | null;
}

interface Estadisticas {
  usuarios: number;
  modulos: number;
  videos: number;
  pdfs: number;
  recursos: number;
  preguntas: number;
  intentos: number;
  promedio: number;
  mejorResultado: number;
  correctas: number;
  incorrectas: number;
}

interface RendimientoModulo {
  id: string;
  titulo: string;
  intentos: number;
  promedio: number;
}

export default function EstadisticasPage() {
  const [estadisticas, setEstadisticas] =
    useState<Estadisticas>({
      usuarios: 0,
      modulos: 0,
      videos: 0,
      pdfs: 0,
      recursos: 0,
      preguntas: 0,
      intentos: 0,
      promedio: 0,
      mejorResultado: 0,
      correctas: 0,
      incorrectas: 0,
    });

  const [rendimientoModulos, setRendimientoModulos] =
    useState<RendimientoModulo[]>([]);

  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  async function obtenerCantidad(
    tabla: string
  ): Promise<number> {
    const { count, error } = await supabase
      .from(tabla)
      .select("*", {
        count: "exact",
        head: true,
      });

    if (error) {
      console.error(
        `Error contando ${tabla}:`,
        error
      );

      return 0;
    }

    return count || 0;
  }

  async function cargarEstadisticas() {
    try {
      setCargando(true);

      /*
       * ==========================================
       * CANTIDAD DE CONTENIDOS
       * ==========================================
       */

      const [
        usuarios,
        modulos,
        videos,
        pdfs,
        recursos,
        preguntas,
      ] = await Promise.all([
        obtenerCantidad("usuarios"),
        obtenerCantidad("modulos"),
        obtenerCantidad("videos"),
        obtenerCantidad("pdfs"),
        obtenerCantidad("recursos"),
        obtenerCantidad("preguntas"),
      ]);

      /*
       * ==========================================
       * INTENTOS DE EXAMEN
       * ==========================================
       */

      const {
        data: intentosData,
        error: intentosError,
      } = await supabase
        .from("intentos_examen")
        .select(`
          id,
          usuario_id,
          modulo_id,
          total_preguntas,
          respuestas_correctas,
          porcentaje,
          fecha,
          modulos (
            titulo
          )
        `)
        .order("fecha", {
          ascending: false,
        });

      if (intentosError) {
        console.error(
          "Error cargando intentos:",
          intentosError
        );
      }

      const intentos =
        (intentosData || []) as Intento[];

      /*
       * ==========================================
       * CÁLCULOS GENERALES
       * ==========================================
       */

      let promedio = 0;
      let mejorResultado = 0;
      let correctas = 0;
      let incorrectas = 0;

      if (intentos.length > 0) {
        const sumaPorcentajes =
          intentos.reduce(
            (suma, intento) =>
              suma +
              Number(
                intento.porcentaje || 0
              ),
            0
          );

        promedio =
          sumaPorcentajes / intentos.length;

        mejorResultado = Math.max(
          ...intentos.map((intento) =>
            Number(
              intento.porcentaje || 0
            )
          )
        );

        correctas =
          intentos.reduce(
            (suma, intento) =>
              suma +
              Number(
                intento.respuestas_correctas || 0
              ),
            0
          );

        const totalPreguntasRespondidas =
          intentos.reduce(
            (suma, intento) =>
              suma +
              Number(
                intento.total_preguntas || 0
              ),
            0
          );

        incorrectas =
          totalPreguntasRespondidas -
          correctas;
      }

      setEstadisticas({
        usuarios,
        modulos,
        videos,
        pdfs,
        recursos,
        preguntas,
        intentos: intentos.length,
        promedio: Math.round(promedio),
        mejorResultado: Math.round(
          mejorResultado
        ),
        correctas,
        incorrectas,
      });

      /*
       * ==========================================
       * RENDIMIENTO POR MÓDULO
       * ==========================================
       */

      const mapaModulos: Record<
        string,
        {
          titulo: string;
          intentos: number;
          suma: number;
        }
      > = {};

      intentos.forEach((intento) => {
        const moduloId = intento.modulo_id;

        const titulo =
          intento.modulos?.[0]?.titulo ||
          "Módulo sin nombre";

        if (!mapaModulos[moduloId]) {
          mapaModulos[moduloId] = {
            titulo,
            intentos: 0,
            suma: 0,
          };
        }

        mapaModulos[moduloId].intentos += 1;

        mapaModulos[moduloId].suma += Number(
          intento.porcentaje || 0
        );
      });

      const rendimiento =
        Object.entries(mapaModulos).map(
          ([id, datos]) => ({
            id,
            titulo: datos.titulo,
            intentos: datos.intentos,
            promedio: Math.round(
              datos.suma / datos.intentos
            ),
          })
        );

      rendimiento.sort(
        (a, b) => b.promedio - a.promedio
      );

      setRendimientoModulos(rendimiento);
    } catch (error) {
      console.error(
        "Error cargando estadísticas:",
        error
      );

      alert(
        "Ocurrió un error al cargar las estadísticas."
      );
    } finally {
      setCargando(false);
    }
  }

  /*
   * ==========================================
   * DATOS PARA EL RESUMEN
   * ==========================================
   */

  const moduloMasPracticado =
    rendimientoModulos.length > 0
      ? [...rendimientoModulos].sort(
          (a, b) => b.intentos - a.intentos
        )[0]
      : null;

  /*
   * ==========================================
   * CARGANDO
   * ==========================================
   */

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-100 p-10">

        <div className="bg-white rounded-2xl shadow p-8">

          <p className="text-gray-600">
            Cargando estadísticas...
          </p>

        </div>

      </main>
    );
  }

  /*
   * ==========================================
   * PÁGINA
   * ==========================================
   */

  return (
    <main>

      {/* ========================================
          ENCABEZADO
      ======================================== */}

      <div className="mb-10">

        <Link
          href="/admin"
          className="text-red-600 font-semibold hover:underline"
        >
          ← Volver al panel
        </Link>

        <h1 className="text-4xl font-bold text-gray-800 mt-6">
          Estadísticas
        </h1>

        <p className="text-gray-500 mt-2 text-lg">
          Resumen general del contenido y
          rendimiento de Material Didáctico MR
          Academy.
        </p>

      </div>

      {/* ========================================
          CONTENIDO DE LA PLATAFORMA
      ======================================== */}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

        <Tarjeta
          icono="👥"
          titulo="Usuarios"
          valor={estadisticas.usuarios}
          color="bg-blue-600"
        />

        <Tarjeta
          icono="📚"
          titulo="Módulos"
          valor={estadisticas.modulos}
          color="bg-purple-600"
        />

        <Tarjeta
          icono="🎥"
          titulo="Videos"
          valor={estadisticas.videos}
          color="bg-red-600"
        />

        <Tarjeta
          icono="📄"
          titulo="PDFs"
          valor={estadisticas.pdfs}
          color="bg-indigo-600"
        />

        <Tarjeta
          icono="📚"
          titulo="Recursos"
          valor={estadisticas.recursos}
          color="bg-green-600"
        />

        <Tarjeta
          icono="📝"
          titulo="Preguntas"
          valor={estadisticas.preguntas}
          color="bg-orange-500"
        />

      </div>

      {/* ========================================
          RESULTADOS DE LAS PRÁCTICAS
      ======================================== */}

      <div className="mt-10">

        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Resultados de las prácticas
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

          <Tarjeta
            icono="🎯"
            titulo="Prácticas realizadas"
            valor={estadisticas.intentos}
            color="bg-cyan-600"
          />

          <Tarjeta
            icono="📈"
            titulo="Promedio general"
            valor={`${estadisticas.promedio}%`}
            color="bg-blue-700"
          />

          <Tarjeta
            icono="🏆"
            titulo="Mejor resultado"
            valor={`${estadisticas.mejorResultado}%`}
            color="bg-yellow-500"
          />

          <Tarjeta
            icono="✅"
            titulo="Respuestas correctas"
            valor={estadisticas.correctas}
            color="bg-green-600"
          />

          <Tarjeta
            icono="❌"
            titulo="Respuestas incorrectas"
            valor={estadisticas.incorrectas}
            color="bg-red-600"
          />

        </div>

      </div>

      {/* ========================================
          RENDIMIENTO POR MÓDULO
      ======================================== */}

      <div className="mt-10">

        <div className="bg-white rounded-2xl shadow overflow-hidden">

          <div className="p-6 border-b">

            <h2 className="text-2xl font-bold text-gray-800">
              Rendimiento por módulo
            </h2>

            <p className="text-gray-500 mt-1">
              Promedio obtenido en las prácticas
              realizadas.
            </p>

          </div>

          {rendimientoModulos.length === 0 ? (

            <div className="p-8 text-gray-500 text-center">
              Todavía no hay prácticas registradas.
            </div>

          ) : (

            <div className="divide-y">

              {rendimientoModulos.map(
                (modulo) => (

                  <div
                    key={modulo.id}
                    className="p-6"
                  >

                    <div className="flex justify-between items-center mb-3">

                      <div>

                        <h3 className="font-bold text-lg text-gray-800">
                          {modulo.titulo}
                        </h3>

                        <p className="text-gray-500 text-sm">
                          {modulo.intentos}{" "}
                          {modulo.intentos === 1
                            ? "práctica"
                            : "prácticas"}
                        </p>

                      </div>

                      <div className="text-2xl font-bold text-red-600">
                        {modulo.promedio}%
                      </div>

                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">

                      <div
                        className={`h-4 rounded-full ${
                          modulo.promedio >= 80
                            ? "bg-green-500"
                            : modulo.promedio >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            modulo.promedio,
                            100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>

      {/* ========================================
          RESUMEN FUNCIONAL DE LA PLATAFORMA
      ======================================== */}

      <div className="mt-10">

        <div className="bg-white rounded-2xl shadow overflow-hidden">

          {/* ENCABEZADO */}

          <div className="bg-gray-800 p-6 text-white">

            <h2 className="text-2xl font-bold">
              📊 Resumen de la plataforma
            </h2>

            <p className="text-gray-300 mt-1">
              Información general de la actividad
              registrada en la academia.
            </p>

          </div>

          {/* DATOS */}

          <div className="p-6 grid md:grid-cols-2 xl:grid-cols-5 gap-5">

            {/* USUARIOS */}

            <ResumenItem
              icono="👥"
              titulo="Usuarios registrados"
              valor={estadisticas.usuarios}
              descripcion="Cuentas registradas"
            />

            {/* PRÁCTICAS */}

            <ResumenItem
              icono="📝"
              titulo="Prácticas realizadas"
              valor={estadisticas.intentos}
              descripcion="Intentos registrados"
            />

            {/* PROMEDIO */}

            <ResumenItem
              icono="📈"
              titulo="Promedio general"
              valor={`${estadisticas.promedio}%`}
              descripcion="Rendimiento promedio"
            />

            {/* MEJOR RESULTADO */}

            <ResumenItem
              icono="🏆"
              titulo="Mejor resultado"
              valor={`${estadisticas.mejorResultado}%`}
              descripcion="Mayor porcentaje obtenido"
            />

            {/* MÓDULO MÁS PRACTICADO */}

            <div className="border rounded-xl p-5 bg-gray-50">

              <div className="text-3xl mb-3">
                📚
              </div>

              <p className="text-gray-500 text-sm">
                Módulo más practicado
              </p>

              {moduloMasPracticado ? (

                <>
                  <h3 className="font-bold text-lg text-gray-800 mt-2 leading-tight">
                    {moduloMasPracticado.titulo}
                  </h3>

                  <p className="text-red-600 font-bold mt-2">
                    {moduloMasPracticado.intentos}{" "}
                    {moduloMasPracticado.intentos === 1
                      ? "práctica"
                      : "prácticas"}
                  </p>
                </>

              ) : (

                <p className="font-semibold text-gray-700 mt-2">
                  Aún no hay prácticas
                </p>

              )}

            </div>

          </div>

          {/* MENSAJE INFORMATIVO */}

          <div className="px-6 pb-6">

            <div className="bg-red-50 border border-red-100 rounded-xl p-5">

              <p className="text-gray-700">

                <strong>
                  Actividad de la plataforma:
                </strong>{" "}

                actualmente hay{" "}

                <strong>
                  {estadisticas.usuarios}
                </strong>{" "}

                usuarios registrados y se han
                realizado{" "}

                <strong>
                  {estadisticas.intentos}
                </strong>{" "}

                prácticas.

                {moduloMasPracticado && (
                  <>
                    {" "}El módulo con mayor cantidad
                    de prácticas es{" "}

                    <strong>
                      {moduloMasPracticado.titulo}
                    </strong>.
                  </>
                )}

              </p>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}

/*
 * ==========================================
 * COMPONENTE TARJETA
 * ==========================================
 */

function Tarjeta({
  icono,
  titulo,
  valor,
  color,
}: {
  icono: string;
  titulo: string;
  valor: string | number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow overflow-hidden">

      <div className={`${color} h-3`} />

      <div className="p-6">

        <div className="text-5xl mb-5">
          {icono}
        </div>

        <h2 className="text-xl font-semibold text-gray-600">
          {titulo}
        </h2>

        <p className="text-5xl font-bold text-gray-800 mt-3">
          {valor}
        </p>

      </div>

    </div>
  );
}

/*
 * ==========================================
 * COMPONENTE RESUMEN
 * ==========================================
 */

function ResumenItem({
  icono,
  titulo,
  valor,
  descripcion,
}: {
  icono: string;
  titulo: string;
  valor: string | number;
  descripcion: string;
}) {
  return (
    <div className="border rounded-xl p-5 bg-gray-50">

      <div className="text-3xl mb-3">
        {icono}
      </div>

      <p className="text-gray-500 text-sm">
        {titulo}
      </p>

      <p className="text-3xl font-bold text-gray-800 mt-2">
        {valor}
      </p>

      <p className="text-gray-500 text-sm mt-1">
        {descripcion}
      </p>

    </div>
  );
}