"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  const iniciarSesion = async () => {

    if (!correo || !password) {
      alert("Complete todos los campos.");
      return;
    }

    setCargando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: correo,
      password,
    });

    setCargando(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/dashboard");

  };

  return (

    <main className="min-h-screen bg-gray-100 flex items-center justify-center">

      <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md">

        <h1 className="text-3xl font-bold text-center text-red-600">
          Material Didáctico MR
        </h1>

        <p className="text-center text-gray-600 mt-2 mb-8">
          Ingrese a su plataforma
        </p>

        <div className="space-y-5">

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
            onClick={iniciarSesion}
            disabled={cargando}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold disabled:bg-gray-400"
          >
            {cargando ? "Ingresando..." : "Ingresar"}
          </button>

          <div className="text-center mt-6">

            <Link
              href="/"
              className="text-red-600 hover:underline"
            >
              ← Volver al inicio
            </Link>

          </div>

        </div>

      </div>

    </main>

  );
}