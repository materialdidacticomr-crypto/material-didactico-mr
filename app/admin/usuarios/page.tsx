"use client";

import { FormEvent, useState } from "react";

export default function UsuariosPage() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"admin" | "asesora" | "estudiante">(
    "estudiante"
  );

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function crearUsuario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMensaje("");
    setError("");

    if (!nombre || !correo || !password || !rol) {
      setError("Complete todos los campos.");
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch("/api/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          correo,
          password,
          rol,
        }),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        setError(resultado.error || "No se pudo crear el usuario.");
        return;
      }

      setMensaje("Usuario creado correctamente.");

      setNombre("");
      setCorreo("");
      setPassword("");
      setRol("estudiante");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">
          Usuarios
        </h1>

        <p className="text-gray-500 mt-2">
          Crear usuarios y asignar sus roles dentro de Material Didáctico MR
          Academy.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl">

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Crear nuevo usuario
        </h2>

        <form onSubmit={crearUsuario} className="space-y-6">

          <div>
            <label className="block mb-2 font-semibold text-gray-700">
              Nombre completo
            </label>

            <input
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Nombre del usuario"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700">
              Correo electrónico
            </label>

            <input
              type="email"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700">
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Contraseña"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

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

          {mensaje && (
            <div className="bg-green-100 border border-green-300 text-green-700 rounded-xl px-4 py-3">
              {mensaje}
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-xl transition"
          >
            {cargando ? "Creando usuario..." : "Crear usuario"}
          </button>

        </form>

      </div>

    </main>
  );
}