"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface UsuarioPerfil {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
}

export default function PerfilPage() {
  const router = useRouter();

  const [usuario, setUsuario] =
    useState<UsuarioPerfil | null>(null);

  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarUsuario();
  }, []);

  async function cargarUsuario() {
    try {
      setCargando(true);

      /*
       * Obtener usuario autenticado
       */

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error(
          "Error obteniendo usuario:",
          authError
        );

        router.push("/login");
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      /*
       * Buscar información del usuario
       * en la tabla usuarios.
       */

      const { data, error } = await supabase
        .from("usuarios")
        .select(
          `
          id,
          nombre,
          correo,
          rol,
          activo
        `
        )
        .eq("correo", user.email)
        .maybeSingle();

      if (error) {
        console.error(
          "Error cargando perfil:",
          error
        );

        /*
         * Si no se puede consultar la tabla,
         * mostramos igualmente el correo
         * del usuario autenticado.
         */

        setUsuario({
          id: user.id,
          nombre:
            user.user_metadata?.nombre ||
            "Estudiante",
          correo: user.email || "",
          rol: "estudiante",
          activo: true,
        });

        setCargando(false);
        return;
      }

      /*
       * Si existe el registro en usuarios,
       * utilizamos sus datos.
       */

      if (data) {
        setUsuario(data);
      } else {
        /*
         * Si todavía no existe el registro
         * en la tabla usuarios, mostramos
         * los datos disponibles de Auth.
         */

        setUsuario({
          id: user.id,
          nombre:
            user.user_metadata?.nombre ||
            "Estudiante",
          correo: user.email || "",
          rol: "estudiante",
          activo: true,
        });
      }
    } catch (error) {
      console.error(
        "Error inesperado:",
        error
      );
    } finally {
      setCargando(false);
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();

    router.push("/login");
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">

        <div className="bg-white rounded-2xl shadow-lg p-10">

          <p className="text-gray-600 text-lg">
            Cargando perfil...
          </p>

        </div>

      </main>
    );
  }

  if (!usuario) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">

        <div className="bg-white rounded-2xl shadow-lg p-10 text-center">

          <h1 className="text-2xl font-bold text-gray-800">
            No se pudo cargar el perfil
          </h1>

          <button
            onClick={() => router.push("/login")}
            className="mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold"
          >
            Ir al inicio de sesión
          </button>

        </div>

      </main>
    );
  }

  /*
   * Primera letra del nombre.
   */

  const inicial =
    usuario.nombre?.charAt(0)?.toUpperCase() ||
    usuario.correo?.charAt(0)?.toUpperCase() ||
    "E";

  return (
    <main className="min-h-screen bg-gray-100">

      <div className="max-w-5xl mx-auto p-10">

        <div className="bg-white rounded-2xl shadow-lg p-10">

          {/* ENCABEZADO DEL PERFIL */}

          <div className="flex items-center gap-6">

            <div className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">

              {inicial}

            </div>

            <div>

              <h1 className="text-4xl font-bold text-red-600">

                Mi Perfil

              </h1>

              <p className="text-gray-500 mt-2">

                Información de tu cuenta.

              </p>

            </div>

          </div>

          {/* INFORMACIÓN */}

          <div className="mt-10 grid gap-6">

            {/* NOMBRE */}

            <div className="border rounded-xl p-6 bg-gray-50">

              <p className="text-gray-500">

                Nombre del estudiante

              </p>

              <h2 className="text-2xl font-bold mt-2 text-gray-800">

                {usuario.nombre}

              </h2>

            </div>

            {/* CORREO */}

            <div className="border rounded-xl p-6">

              <p className="text-gray-500">

                Correo electrónico

              </p>

              <h2 className="text-2xl font-bold mt-2 text-gray-800">

                {usuario.correo}

              </h2>

            </div>

            {/* ROL */}

            <div className="border rounded-xl p-6">

              <p className="text-gray-500">

                Tipo de usuario

              </p>

              <h2 className="text-2xl font-bold mt-2 text-gray-800 capitalize">

                {usuario.rol || "Estudiante"}

              </h2>

            </div>

            {/* ESTADO */}

            <div className="border rounded-xl p-6">

              <p className="text-gray-500">

                Estado de la cuenta

              </p>

              <h2
                className={`text-2xl font-bold mt-2 ${
                  usuario.activo
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >

                {usuario.activo
                  ? "Activo"
                  : "Inactivo"}

              </h2>

            </div>

          </div>

          {/* CERRAR SESIÓN */}

          <button
            onClick={cerrarSesion}
            className="mt-10 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold"
          >

            Cerrar sesión

          </button>

        </div>

      </div>

    </main>
  );
}