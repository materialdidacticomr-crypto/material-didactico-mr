"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function RegistroPage() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  const crearCuenta = async () => {
    if (!nombre || !correo || !password) {
      alert("Complete todos los campos.");
      return;
    }

    setCargando(true);

    const { error } = await supabase.auth.signUp({
      email: correo,
      password: password,
      options: {
        data: {
          nombre,
        },
      },
    });

    setCargando(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      "Cuenta creada correctamente. Revise su correo para confirmar el registro."
    );

    setNombre("");
    setCorreo("");
    setPassword("");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

        <h1 className="text-4xl font-bold text-red-600 text-center">
          Crear cuenta
        </h1>

        <p className="text-center text-gray-600 mt-2 mb-8">
          Regístrese para comenzar su preparación.
        </p>

        <div className="space-y-5">

          <div>
            <label className="block mb-2 font-medium">
              Nombre completo
            </label>

            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingrese su nombre"
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Correo electrónico
            </label>

            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <button
            onClick={crearCuenta}
            disabled={cargando}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition disabled:bg-gray-400"
          >
            {cargando ? "Creando cuenta..." : "Crear cuenta"}
          </button>

        </div>

      </div>
    </main>
  );
}