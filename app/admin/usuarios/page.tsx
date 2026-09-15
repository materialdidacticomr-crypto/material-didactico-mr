"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

interface ModuloRendimiento {
  modulo_id: string;
  titulo: string;
  practicas: number;
  promedio: number;
}

interface Estudiante {
  id: string;
  nombre: string;
  correo: string;
  activo: boolean;
  created_at: string;

  practicas: number;
  promedio: number;
  mejorResultado: number;
  ultimaPractica: string | null;

  rendimientoModulos: ModuloRendimiento[];
}

export default function UsuariosPage() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  const [rol, setRol] = useState<
    "admin" | "asesora" | "estudiante"
  >("estudiante");

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [estudiantes, setEstudiantes] =
    useState<Estudiante[]>([]);

  const [cargandoEstudiantes, setCargandoEstudiantes] =
    useState(true);

  const [errorEstudiantes, setErrorEstudiantes] =
    useState("");

  const [estudianteAbierto, setEstudianteAbierto] =
    useState<string | null>(null);

  const [eliminando, setEliminando] =
    useState<string | null>(null);

  /*
   * ==========================================
   * CARGAR ESTUDIANTES Y PROGRESO
   * ==========================================
   */

  async function cargarEstudiantes() {
    setCargandoEstudiantes(true);
    setErrorEstudiantes("");

    try {
      let {
        data: { session },
      } = await supabase.auth.getSession();

      /*
       * Si no existe sesión, intentamos renovarla.
       */

      if (!session) {
        const {
          data: refrescada,
          error: errorRefresh,
        } = await supabase.auth.refreshSession();

        if (errorRefresh) {
          setErrorEstudiantes(
            "La sesión ha expirado. Inicie sesión nuevamente."
          );

          return;
        }

        session = refrescada.session;
      }

      if (!session?.access_token) {
        setErrorEstudiantes(
          "No se pudo obtener la sesión de administrador."
        );

        return;
      }

      const respuesta = await fetch(
        "/api/usuarios",
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
          },
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setErrorEstudiantes(
          resultado.error ||
            "No se pudo cargar el progreso."
        );

        return;
      }

      setEstudiantes(
        resultado.estudiantes || []
      );
    } catch (error) {
      console.error(
        "Error al cargar estudiantes:",
        error
      );

      setErrorEstudiantes(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setCargandoEstudiantes(false);
    }
  }

  /*
   * Cargar automáticamente al entrar.
   */

  useEffect(() => {
    cargarEstudiantes();
  }, []);

  /*
   * ==========================================
   * CREAR USUARIO
   * ==========================================
   */

  async function crearUsuario(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMensaje("");
    setError("");

    if (
      !nombre ||
      !correo ||
      !password ||
      !rol
    ) {
      setError(
        "Complete todos los campos."
      );

      return;
    }

    setCargando(true);

    try {
      let {
        data: { session },
      } = await supabase.auth.getSession();

      /*
       * Intentar renovar la sesión si fuera necesario.
       */

      if (!session) {
        const {
          data: refrescada,
          error: errorRefresh,
        } = await supabase.auth.refreshSession();

        if (errorRefresh) {
          setError(
            "La sesión ha expirado. Inicie sesión nuevamente."
          );

          return;
        }

        session = refrescada.session;
      }

      if (!session?.access_token) {
        setError(
          "No se pudo obtener la sesión de administrador."
        );

        return;
      }

      const respuesta = await fetch(
        "/api/usuarios",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${session.access_token}`,
          },

          body: JSON.stringify({
            nombre,
            correo,
            password,
            rol,
          }),
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setError(
          resultado.error ||
            "No se pudo crear el usuario."
        );

        return;
      }

      setMensaje(
        "Usuario creado correctamente."
      );

      setNombre("");
      setCorreo("");
      setPassword("");
      setRol("estudiante");

      /*
       * Actualizamos la lista después
       * de crear el usuario.
       */

      await cargarEstudiantes();
    } catch (error) {
      console.error(
        "Error al crear usuario:",
        error
      );

      setError(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setCargando(false);
    }
  }

  /*
   * ==========================================
   * ELIMINAR ESTUDIANTE
   * ==========================================
   */

  async function eliminarEstudiante(
    estudiante: Estudiante
  ) {
    const confirmar = window.confirm(
      `¿Está seguro de eliminar a ${estudiante.nombre}?\n\n` +
        `Esta acción eliminará también sus resultados de prácticas y no se puede deshacer.`
    );

    if (!confirmar) {
      return;
    }

    setMensaje("");
    setError("");
    setEliminando(estudiante.id);

    try {
      let {
        data: { session },
      } = await supabase.auth.getSession();

      /*
       * Intentar renovar la sesión si fuera necesario.
       */

      if (!session) {
        const {
          data: refrescada,
          error: errorRefresh,
        } = await supabase.auth.refreshSession();

        if (errorRefresh) {
          setError(
            "La sesión ha expirado. Inicie sesión nuevamente."
          );

          return;
        }

        session = refrescada.session;
      }

      if (!session?.access_token) {
        setError(
          "No se pudo obtener la sesión de administrador."
        );

        return;
      }

      const respuesta = await fetch(
        "/api/usuarios",
        {
          method: "DELETE",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${session.access_token}`,
          },

          body: JSON.stringify({
            id: estudiante.id,
          }),
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setError(
          resultado.error ||
            "No se pudo eliminar el estudiante."
        );

        return;
      }

      /*
       * Cerramos el detalle por si estaba abierto.
       */

      if (estudianteAbierto === estudiante.id) {
        setEstudianteAbierto(null);
      }

      setMensaje(
        `El estudiante ${estudiante.nombre} fue eliminado correctamente.`
      );

      /*
       * Volvemos a cargar la lista.
       */

      await cargarEstudiantes();
    } catch (error) {
      console.error(
        "Error al eliminar estudiante:",
        error
      );

      setError(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setEliminando(null);
    }
  }

  /*
   * ==========================================
   * FORMATEAR FECHA
   * ==========================================
   */

  function formatearFecha(
    fecha: string | null
  ) {
    if (!fecha) {
      return "Sin actividad";
    }

    return new Date(
      fecha
    ).toLocaleString("es-CR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  /*
   * ==========================================
   * INTERFAZ
   * ==========================================
   */

  return (
    <main>

      {/* ======================================
          ENCABEZADO
      ======================================= */}

      <div className="mb-8">

        <h1 className="text-4xl font-bold text-gray-800">
          Usuarios
        </h1>

        <p className="text-gray-500 mt-2">
          Crear usuarios y consultar el
          progreso de los estudiantes de
          Material Didáctico MR Academy.
        </p>

      </div>

      {/* ======================================
          CREAR USUARIO
      ======================================= */}

      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl">

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Crear nuevo usuario
        </h2>

        <form
          onSubmit={crearUsuario}
          className="space-y-6"
        >

          {/* Nombre */}

          <div>

            <label className="block mb-2 font-semibold text-gray-700">
              Nombre completo
            </label>

            <input
              type="text"
              value={nombre}
              onChange={(event) =>
                setNombre(
                  event.target.value
                )
              }
              placeholder="Nombre del usuario"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
            />

          </div>

          {/* Correo */}

          <div>

            <label className="block mb-2 font-semibold text-gray-700">
              Correo electrónico
            </label>

            <input
              type="email"
              value={correo}
              onChange={(event) =>
                setCorreo(
                  event.target.value
                )
              }
              placeholder="correo@ejemplo.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
            />

          </div>

          {/* Contraseña */}

          <div>

            <label className="block mb-2 font-semibold text-gray-700">
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Contraseña"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
            />

          </div>

          {/* Rol */}

          <div>

            <label className="block mb-2 font-semibold text-gray-700">
              Rol del usuario
            </label>

            <select
              value={rol}
              onChange={(event) =>
                setRol(
                  event.target.value as
                    | "admin"
                    | "asesora"
                    | "estudiante"
                )
              }
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-red-500"
            >

              <option value="estudiante">
                Estudiante
              </option>

              <option value="asesora">
                Asesora
              </option>

              <option value="admin">
                Administrador
              </option>

            </select>

          </div>

          {/* Mensaje */}

          {mensaje && (
            <div className="bg-green-100 border border-green-300 text-green-700 rounded-xl px-4 py-3">
              {mensaje}
            </div>
          )}

          {/* Error */}

          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Botón */}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition"
          >

            {cargando
              ? "Creando usuario..."
              : "Crear usuario"}

          </button>

        </form>

      </div>

      {/* ======================================
          PROGRESO DE ESTUDIANTES
      ======================================= */}

      <section className="mt-10">

        {/* Encabezado */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

          <div>

            <h2 className="text-3xl font-bold text-gray-800">
              👨‍🎓 Progreso de estudiantes
            </h2>

            <p className="text-gray-500 mt-1">
              Seguimiento de las prácticas
              realizadas por cada estudiante.
            </p>

          </div>

          <button
            type="button"
            onClick={cargarEstudiantes}
            disabled={cargandoEstudiantes}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-5 py-3 rounded-xl transition"
          >
            🔄 Actualizar
          </button>

        </div>

        {/* Mensaje general */}

        {mensaje && (
          <div className="bg-green-100 border border-green-300 text-green-700 rounded-xl px-5 py-4 mb-6">
            {mensaje}
          </div>
        )}

        {/* Error de estudiantes */}

        {errorEstudiantes && (

          <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl px-5 py-4 mb-6">

            {errorEstudiantes}

          </div>

        )}

        {/* Cargando */}

        {cargandoEstudiantes ? (

          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">

            <p className="text-gray-500">
              Cargando progreso de estudiantes...
            </p>

          </div>

        ) : estudiantes.length === 0 ? (

          /* Sin estudiantes */

          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">

            <p className="text-gray-500">
              Todavía no hay estudiantes
              registrados.
            </p>

          </div>

        ) : (

          /* Lista */

          <div className="space-y-5">

            {estudiantes.map(
              (estudiante) => {

                const abierto =
                  estudianteAbierto ===
                  estudiante.id;

                const estaEliminando =
                  eliminando ===
                  estudiante.id;

                return (

                  <div
                    key={estudiante.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden"
                  >

                    {/* =================================
                        INFORMACIÓN PRINCIPAL
                    ================================== */}

                    <div className="p-6">

                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                        {/* Nombre */}

                        <div>

                          <div className="flex flex-wrap items-center gap-3">

                            <h3 className="text-2xl font-bold text-gray-800">
                              {estudiante.nombre}
                            </h3>

                            {estudiante.activo ? (

                              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                                ACTIVO
                              </span>

                            ) : (

                              <span className="bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
                                INACTIVO
                              </span>

                            )}

                          </div>

                          <p className="text-gray-500 mt-1">
                            {estudiante.correo}
                          </p>

                        </div>

                        {/* =================================
                            BOTONES
                        ================================== */}

                        <div className="flex flex-col sm:flex-row gap-3">

                          {/* Botón detalle */}

                          <button
                            type="button"
                            onClick={() =>
                              setEstudianteAbierto(
                                abierto
                                  ? null
                                  : estudiante.id
                              )
                            }
                            disabled={estaEliminando}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold px-6 py-3 rounded-xl transition"
                          >

                            {abierto
                              ? "Ocultar detalle ↑"
                              : "Ver detalle →"}

                          </button>

                          {/* Botón eliminar */}

                          <button
                            type="button"
                            onClick={() =>
                              eliminarEstudiante(
                                estudiante
                              )
                            }
                            disabled={estaEliminando}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold px-6 py-3 rounded-xl transition"
                          >

                            {estaEliminando
                              ? "Eliminando..."
                              : "Eliminar"}

                          </button>

                        </div>

                      </div>

                      {/* =================================
                          TARJETAS DE RESUMEN
                      ================================== */}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">

                        {/* Prácticas */}

                        <div className="bg-gray-50 rounded-xl p-5">

                          <p className="text-gray-500 text-sm">
                            Prácticas
                          </p>

                          <p className="text-3xl font-bold text-gray-800 mt-1">
                            {estudiante.practicas}
                          </p>

                        </div>

                        {/* Promedio */}

                        <div className="bg-blue-50 rounded-xl p-5">

                          <p className="text-blue-700 text-sm">
                            Promedio general
                          </p>

                          <p className="text-3xl font-bold text-blue-700 mt-1">

                            {estudiante.practicas > 0
                              ? `${estudiante.promedio}%`
                              : "—"}

                          </p>

                        </div>

                        {/* Mejor resultado */}

                        <div className="bg-yellow-50 rounded-xl p-5">

                          <p className="text-yellow-700 text-sm">
                            Mejor resultado
                          </p>

                          <p className="text-3xl font-bold text-yellow-700 mt-1">

                            {estudiante.practicas > 0
                              ? `${estudiante.mejorResultado}%`
                              : "—"}

                          </p>

                        </div>

                        {/* Última actividad */}

                        <div className="bg-green-50 rounded-xl p-5">

                          <p className="text-green-700 text-sm">
                            Última actividad
                          </p>

                          <p className="text-sm font-bold text-green-700 mt-2">

                            {formatearFecha(
                              estudiante.ultimaPractica
                            )}

                          </p>

                        </div>

                      </div>

                    </div>

                    {/* =================================
                        DETALLE DEL ESTUDIANTE
                    ================================== */}

                    {abierto && (

                      <div className="border-t bg-gray-50 p-6">

                        <h4 className="text-xl font-bold text-gray-800 mb-5">
                          📊 Rendimiento por módulo
                        </h4>

                        {estudiante.rendimientoModulos
                          .length === 0 ? (

                          <div className="bg-white rounded-xl p-6 text-center">

                            <p className="text-gray-500">
                              Este estudiante
                              todavía no ha
                              realizado
                              prácticas.
                            </p>

                          </div>

                        ) : (

                          <div className="space-y-4">

                            {estudiante.rendimientoModulos.map(
                              (modulo) => (

                                <div
                                  key={
                                    modulo.modulo_id
                                  }
                                  className="bg-white rounded-xl p-5"
                                >

                                  <div className="flex justify-between items-center mb-3">

                                    <div>

                                      <p className="font-bold text-gray-800">
                                        {modulo.titulo}
                                      </p>

                                      <p className="text-sm text-gray-500">

                                        {modulo.practicas}{" "}

                                        {modulo.practicas ===
                                        1
                                          ? "práctica"
                                          : "prácticas"}

                                      </p>

                                    </div>

                                    <p className="text-2xl font-bold text-red-600">

                                      {modulo.promedio}%

                                    </p>

                                  </div>

                                  {/* Barra */}

                                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">

                                    <div
                                      className="bg-red-600 h-3 rounded-full transition-all"
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          Math.max(
                                            0,
                                            modulo.promedio
                                          )
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

                    )}

                  </div>

                );
              }
            )}

          </div>

        )}

      </section>

    </main>
  );
}