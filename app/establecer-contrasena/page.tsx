
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function EstablecerContrasenaPage() {
  const router = useRouter();
  const procesoRef = useRef<Promise<void> | null>(null);

  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let activo = true;

    async function verificarInvitacion() {
      if (!procesoRef.current) {
        procesoRef.current = (async () => {
          const parametros = new URLSearchParams(
            window.location.search
          );

          const fragmento = new URLSearchParams(
            window.location.hash.substring(1)
          );

          const errorUrl =
            parametros.get("error_description") ||
            fragmento.get("error_description") ||
            parametros.get("error") ||
            fragmento.get("error");

          if (errorUrl) {
            throw new Error(
              errorUrl.replace(/\+/g, " ")
            );
          }

          // Caso 1: Supabase devuelve access_token y refresh_token
          // dentro del fragmento de la dirección.
          const accessToken = fragmento.get("access_token");
          const refreshToken = fragmento.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error: errorSesion } =
              await supabaseBrowser.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

            if (errorSesion) {
              throw new Error(
                "No se pudo validar la sesión de invitación. Solicitá una nueva invitación."
              );
            }
          }

          // Caso 2: Supabase devuelve un código PKCE.
          else {
            const code = parametros.get("code");

            if (code) {
              const { error: errorCodigo } =
                await supabaseBrowser.auth.exchangeCodeForSession(
                  code
                );

              if (errorCodigo) {
                throw new Error(
                  "El enlace de invitación no pudo validarse o ya fue utilizado."
                );
              }
            }

            // Caso 3: Supabase devuelve token_hash.
            else {
              const tokenHash =
                parametros.get("token_hash") ||
                fragmento.get("token_hash");

              const type =
                parametros.get("type") ||
                fragmento.get("type");

              if (tokenHash && type === "invite") {
                const { error: errorToken } =
                  await supabaseBrowser.auth.verifyOtp({
                    token_hash: tokenHash,
                    type: "invite",
                  });

                if (errorToken) {
                  throw new Error(
                    "La invitación no pudo validarse o ya fue utilizada."
                  );
                }
              }
            }
          }

          // Confirmar que Supabase haya creado la sesión.
          const {
            data: { user },
            error: errorUsuario,
          } = await supabaseBrowser.auth.getUser();

          if (errorUsuario || !user) {
            throw new Error(
              "No encontramos una invitación activa. Solicitá una nueva invitación al administrador."
            );
          }

          // Limpiar los parámetros sensibles de la dirección.
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        })();
      }

      try {
        await procesoRef.current;

        if (activo) {
          setAutorizado(true);
          setError("");
        }
      } catch (err) {
        if (activo) {
          setAutorizado(false);
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo verificar la invitación."
          );
        }
      } finally {
        if (activo) {
          setVerificando(false);
        }
      }
    }

    verificarInvitacion();

    return () => {
      activo = false;
    };
  }, []);

  async function guardarContrasena(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!autorizado) {
      setError("Primero debemos validar tu invitación.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);

    try {
      const {
        data: { user },
        error: errorUsuario,
      } = await supabaseBrowser.auth.getUser();

      if (errorUsuario || !user) {
        throw new Error(
          "Tu sesión de invitación ha expirado. Solicitá una nueva invitación."
        );
      }

      const { error: errorPassword } =
        await supabaseBrowser.auth.updateUser({
          password,
        });

      if (errorPassword) {
        throw new Error(errorPassword.message);
      }

      const { data: perfil, error: errorPerfil } =
        await supabaseBrowser
          .from("usuarios")
          .select("rol, activo")
          .eq("id", user.id)
          .single();

      if (errorPerfil || !perfil || !perfil.activo) {
        throw new Error(
          "No se pudo verificar tu perfil. Contactá al administrador de CAMPUS MR."
        );
      }

      setPassword("");
      setConfirmacion("");

      setMensaje(
        "¡Contraseña establecida correctamente! Ahora podés iniciar sesión."
      );

      setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un problema al establecer la contraseña."
      );
    } finally {
      setCargando(false);
    }
  }

  if (verificando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <section className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mb-4 text-4xl">🔐</div>
          <h1 className="text-xl font-black text-slate-800">
            Verificando invitación
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Estamos validando tu acceso a CAMPUS MR.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl md:p-10">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-4xl">
            🔐
          </div>

          <h1 className="text-3xl font-black text-slate-800">
            Activar mi cuenta
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Bienvenido a CAMPUS MR 2.0. Creá tu contraseña personal para comenzar a utilizar la plataforma.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {mensaje}
          </div>
        )}

        {autorizado && (
          <form onSubmit={guardarContrasena} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Nueva contraseña
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                minLength={8}
                required
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-300 p-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Confirmar contraseña
              </label>

              <input
                type="password"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                placeholder="Repetí tu contraseña"
                minLength={8}
                required
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-300 p-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-800">
              <strong>Recomendación:</strong>
              <p className="mt-1">
                Utilizá una contraseña personal, difícil de adivinar y que no compartás con otras personas.
              </p>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-xl bg-indigo-700 py-4 font-bold text-white shadow transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cargando
                ? "Guardando contraseña..."
                : "Activar mi cuenta"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          Material Didáctico MR · CAMPUS MR 2.0
        </p>
      </section>
    </main>
  );
}
