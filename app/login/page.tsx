
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
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const iniciarSesion = async () => {
    if (!correo || !password) {
      alert("Complete todos los campos.");
      return;
    }

    setCargando(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: correo,
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      router.push("/dashboard");
    } catch {
      alert("Ocurrió un problema al iniciar sesión. Intentá nuevamente.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FFF9FC] px-5 py-12">

      {/* DECORACIÓN DE FONDO */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[450px] w-[450px] rounded-full bg-[#F8DCEB] opacity-70 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#EADCFB] opacity-70 blur-3xl" />

      <div className="pointer-events-none absolute right-1/3 top-1/3 h-64 w-64 rounded-full bg-[#FCEAF2] opacity-60 blur-3xl" />

      {/* VOLVER AL INICIO */}
      <Link
        href="/"
        className="absolute left-5 top-5 z-20 inline-flex items-center gap-2 rounded-full border border-[#EBD6E9] bg-white/80 px-4 py-2.5 text-sm font-semibold text-[#94658F] shadow-sm transition hover:bg-[#F9E8F3] sm:left-10 sm:top-8"
      >
        <span>←</span>
        Volver al inicio
      </Link>

      {/* TARJETA DE ACCESO */}
      <section className="relative z-10 w-full max-w-md rounded-[2rem] border border-white bg-white/90 p-7 shadow-2xl shadow-[#BFA7CB]/20 backdrop-blur-md sm:p-10">

        {/* LOGO */}
        <div className="mb-7 flex flex-col items-center text-center">

          <img
            src="/logo-material-didactico-mr.png"
            alt="Logo Material Didáctico MR"
            className="mb-4 h-24 w-24 rounded-3xl bg-white object-contain p-2 shadow-md"
          />

          <h1 className="text-2xl font-bold tracking-tight text-[#49375E] sm:text-3xl">
            Material Didáctico{" "}
            <span className="text-[#D45C9C]">MR</span>
          </h1>

          <p className="mt-2 text-xs font-semibold tracking-[0.3em] text-[#A28BAF]">
            CAMPUS MR 2.0
          </p>

          <div className="mt-5 h-1 w-20 rounded-full bg-gradient-to-r from-[#B56AC8] to-[#E47CA9]" />

        </div>

        {/* BIENVENIDA */}
        <div className="mb-7 text-center">

          <div className="mb-3 text-3xl">🌸</div>

          <h2 className="text-xl font-bold text-[#49375E]">
            ¡Bienvenido a tu espacio!
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#91849D]">
            Ingresá a CAMPUS MR 2.0 y continuá con tus actividades.
          </p>

        </div>

        {/* FORMULARIO */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            iniciarSesion();
          }}
          className="space-y-5"
        >

          {/* CORREO */}
          <div>

            <label className="mb-2 block text-sm font-bold text-[#59436D]">
              Correo electrónico
            </label>

            <div className="relative">

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                ✉️
              </span>

              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@ejemplo.com"
                autoComplete="username"
                required
                className="w-full rounded-xl border border-[#EAD9E9] bg-[#FFFAFD] py-4 pl-12 pr-4 text-sm text-[#49375E] outline-none transition placeholder:text-[#B7A9BD] focus:border-[#C47AB5] focus:ring-4 focus:ring-[#F8E5F2]"
              />

            </div>

          </div>

          {/* CONTRASEÑA */}
          <div>

            <label className="mb-2 block text-sm font-bold text-[#59436D]">
              Contraseña
            </label>

            <div className="relative">

              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                🔒
              </span>

              <input
                type={mostrarPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresá tu contraseña"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-[#EAD9E9] bg-[#FFFAFD] py-4 pl-12 pr-16 text-sm text-[#49375E] outline-none transition placeholder:text-[#B7A9BD] focus:border-[#C47AB5] focus:ring-4 focus:ring-[#F8E5F2]"
              />

              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#A45B91] hover:text-[#75447F]"
              >
                {mostrarPassword ? "Ocultar" : "Mostrar"}
              </button>

            </div>

          </div>

          {/* BOTÓN INGRESAR */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-xl bg-gradient-to-r from-[#A95AC0] to-[#D45C9C] py-4 font-bold text-white shadow-lg shadow-[#D8B6DF]/40 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cargando ? "Ingresando..." : "Ingresar a CAMPUS MR →"}
          </button>

        </form>

        {/* MENSAJE INFERIOR */}
        <div className="mt-7 rounded-xl bg-gradient-to-r from-[#FDF0F7] to-[#F3EDFC] p-4 text-center">

          <p className="text-sm font-semibold text-[#855A91]">
            💗 ¡Nos alegra tenerte aquí!
          </p>

          <p className="mt-1 text-xs leading-5 text-[#9B8BA5]">
            Tu espacio para aprender, organizarte y crecer.
          </p>

        </div>

        {/* PIE */}
        <p className="mt-7 text-center text-xs text-[#A292AD]">
          Material Didáctico MR · CAMPUS MR 2.0
        </p>

      </section>

    </main>
  );
}
