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
  avatar_tipo: string | null;
  avatar_seleccionado: string | null;
}

const AVATARES = [
  {
    id: "maestra-morena",
    nombre: "Maestra morena",
    imagen: "/avatares/maestra-morena.png",
  },
  {
    id: "maestra-clara",
    nombre: "Maestra clara",
    imagen: "/avatares/maestra-clara.png",
  },
  {
    id: "maestro-lentes",
    nombre: "Maestro con lentes",
    imagen: "/avatares/maestro-lentes.png",
  },
  {
    id: "maestro-barba",
    nombre: "Maestro con barba",
    imagen: "/avatares/maestro-barba.png",
  },
];

function obtenerRutaInicio(rol: string) {
  switch (rol) {
    case "admin":
      return "/admin";
    case "asesora":
      return "/asesora";
    case "docente":
      return "/dashboard";
    case "estudiante":
      return "/campus";
    default:
      return "/dashboard";
  }
}

function nombreRol(rol: string) {
  switch (rol) {
    case "admin":
      return "Administrador";
    case "asesora":
      return "Asesora";
    case "docente":
      return "Docente";
    case "estudiante":
      return "Estudiante";
    default:
      return rol;
  }
}

export default function PerfilPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<UsuarioPerfil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");

  useEffect(() => {
    cargarUsuario();
  }, []);

  async function cargarUsuario() {
    try {
      setCargando(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("usuarios")
        .select(`
          id,
          nombre,
          correo,
          rol,
          activo,
          avatar_tipo,
          avatar_seleccionado
        `)
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error cargando perfil:", error);
        setMensaje("No se pudo consultar tu perfil.");
        return;
      }

      if (!data) {
        setMensaje("No se encontró tu registro en la tabla de usuarios.");
        return;
      }

      setUsuario(data);

      if (
        data.avatar_tipo === "fotografia" &&
        data.avatar_seleccionado
      ) {
        const { data: signedData, error: signedError } =
          await supabase.storage
            .from("avatares")
            .createSignedUrl(data.avatar_seleccionado, 3600);

        if (!signedError && signedData) {
          setFotoUrl(signedData.signedUrl);
        }
      }
    } catch (error) {
      console.error("Error inesperado:", error);
      setMensaje("Ocurrió un error al cargar el perfil.");
    } finally {
      setCargando(false);
    }
  }

  async function guardarAvatar(avatarId: string) {
    if (!usuario) return;

    try {
      setGuardando(true);
      setMensaje("");

      const { error } = await supabase
        .from("usuarios")
        .update({
          avatar_tipo: "predeterminado",
          avatar_seleccionado: avatarId,
        })
        .eq("id", usuario.id);

      if (error) throw error;

      setUsuario({
        ...usuario,
        avatar_tipo: "predeterminado",
        avatar_seleccionado: avatarId,
      });

      setFotoUrl("");
      setMensaje("¡Avatar guardado correctamente!");
    } catch (error) {
      console.error("Error guardando avatar:", error);
      setMensaje("No se pudo guardar el avatar. Revisa los permisos.");
    } finally {
      setGuardando(false);
    }
  }

  async function subirFotografia(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    if (!usuario) return;

    const archivo = event.target.files?.[0];
    if (!archivo) return;

    const formatosPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!formatosPermitidos.includes(archivo.type)) {
      setMensaje("Solo puedes subir imágenes JPG, PNG o WEBP.");
      event.target.value = "";
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      setMensaje("La fotografía no puede superar los 5 MB.");
      event.target.value = "";
      return;
    }

    try {
      setGuardando(true);
      setMensaje("");

      const extension =
        archivo.name.split(".").pop()?.toLowerCase() || "png";

      const ruta = `${usuario.id}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatares")
        .upload(ruta, archivo, {
          contentType: archivo.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("usuarios")
        .update({
          avatar_tipo: "fotografia",
          avatar_seleccionado: ruta,
        })
        .eq("id", usuario.id);

      if (updateError) {
        await supabase.storage.from("avatares").remove([ruta]);
        throw updateError;
      }

      const { data: signedData, error: signedError } =
        await supabase.storage
          .from("avatares")
          .createSignedUrl(ruta, 3600);

      if (signedError || !signedData) {
        throw signedError || new Error(
          "No se pudo mostrar la fotografía."
        );
      }

      setUsuario({
        ...usuario,
        avatar_tipo: "fotografia",
        avatar_seleccionado: ruta,
      });

      setFotoUrl(signedData.signedUrl);
      setMensaje("¡Fotografía guardada correctamente!");
    } catch (error) {
      console.error("Error subiendo fotografía:", error);
      setMensaje(
        "No se pudo subir la fotografía. Inténtalo nuevamente."
      );
    } finally {
      setGuardando(false);
      event.target.value = "";
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fff8fc] via-white to-[#f2eaff] px-5">
        <div className="rounded-3xl border border-pink-100 bg-white px-10 py-9 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 text-2xl">
            🍎
          </div>
          <p className="text-base font-bold text-[#79518e]">
            Cargando tu perfil...
          </p>
        </div>
      </main>
    );
  }

  if (!usuario) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fff8fc] via-white to-[#f2eaff] p-6">
        <div className="w-full max-w-md rounded-3xl border border-pink-100 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black text-[#49375E]">
            No se pudo cargar el perfil
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">{mensaje}</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 rounded-xl bg-gradient-to-r from-[#b45bc4] to-[#df579e] px-6 py-3 font-bold text-white shadow-md"
          >
            Ir al inicio de sesión
          </button>
        </div>
      </main>
    );
  }

  const rutaInicio = obtenerRutaInicio(usuario.rol);

  const avatarActual =
    AVATARES.find(
      (avatar) => avatar.id === usuario.avatar_seleccionado
    ) || AVATARES[0];

  const imagenActual =
    usuario.avatar_tipo === "fotografia" && fotoUrl
      ? fotoUrl
      : avatarActual.imagen;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#fff8fc] via-white to-[#f2eaff] px-4 py-8 md:py-12">
      <div className="pointer-events-none absolute -right-40 -top-32 h-[30rem] w-[30rem] rounded-full bg-[#eadcfb]/60 blur-[100px]" />
      <div className="pointer-events-none absolute -left-40 top-[35rem] h-[28rem] w-[28rem] rounded-full bg-[#f8dceb]/60 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push(rutaInicio)}
            className="inline-flex items-center gap-2 rounded-full border border-[#ead6e9] bg-white/90 px-5 py-2.5 text-sm font-bold text-[#79518e] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fceaf2]"
          >
            <span aria-hidden="true">←</span>
            Volver a mi panel
          </button>

          <div className="flex items-center gap-2 rounded-full border border-white bg-white/80 px-4 py-2 shadow-sm">
            <img
              src="/logo-material-didactico-mr.png"
              alt="Material Didáctico MR"
              className="h-8 w-8 object-contain"
            />
            <span className="text-xs font-extrabold text-[#60436f]">
              CAMPUS <span className="text-[#d45c9c]">MR</span>
            </span>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] border border-white bg-white/85 p-6 shadow-[0_18px_55px_rgba(177,135,179,0.12)] backdrop-blur-md sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#f5d7ea]/70 blur-[75px]" />
          <div className="pointer-events-none absolute bottom-[-6rem] right-[25%] h-56 w-56 rounded-full bg-[#e4d9f8]/70 blur-[75px]" />

          <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <div className="relative shrink-0">
              <div className="absolute inset-0 scale-125 rounded-full bg-gradient-to-br from-[#f5d7ea] to-[#e4d9f8] blur-2xl" />
              <img
                src={imagenActual}
                alt="Imagen de perfil"
                className="relative h-32 w-32 rounded-full border-4 border-white object-cover shadow-[0_10px_30px_rgba(155,94,142,0.20)] sm:h-36 sm:w-36"
              />
              <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#d45c9c] text-sm text-white">
                ✓
              </span>
            </div>

            <div className="text-center sm:text-left">
              <p className="text-[10px] font-extrabold tracking-[0.23em] text-[#b16a9b]">
                TU ESPACIO PERSONAL
              </p>
              <h1 className="mt-2 text-3xl font-black text-[#382b50] sm:text-4xl">
                Mi perfil
              </h1>
              <p className="mt-2 text-sm text-[#81748d]">
                Personaliza tu cuenta y administra tu imagen en Material Didáctico MR.
              </p>
              <p className="mt-3 text-lg font-extrabold text-[#59436d]">
                {usuario.nombre}
              </p>
              <span className="mt-2 inline-flex rounded-full bg-[#fceaf2] px-3 py-1.5 text-xs font-bold capitalize text-[#b84786]">
                {nombreRol(usuario.rol)}
              </span>
            </div>
          </div>
        </section>

        <section className="mt-7 rounded-[1.7rem] border border-[#f1dceb] bg-white p-6 shadow-[0_12px_35px_rgba(177,135,179,0.09)] sm:p-8">
          <div className="mb-6">
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#b16a9b]">
              PERSONALIZACIÓN
            </p>
            <h2 className="mt-2 text-xl font-black text-[#49375e] sm:text-2xl">
              Elige tu avatar
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#81748d]">
              Selecciona el personaje que aparecerá en tu perfil y en tu espacio de trabajo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {AVATARES.map((avatar) => {
              const seleccionado =
                usuario.avatar_tipo === "predeterminado" &&
                usuario.avatar_seleccionado === avatar.id;

              return (
                <button
                  key={avatar.id}
                  type="button"
                  disabled={guardando}
                  onClick={() => guardarAvatar(avatar.id)}
                  className={`group rounded-2xl border-2 p-3 text-center transition duration-200 hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 ${
                    seleccionado
                      ? "border-[#d45c9c] bg-[#fff3f9] shadow-md shadow-pink-100"
                      : "border-[#eee5f0] bg-[#fffdfd] hover:border-[#d9c5e9]"
                  }`}
                >
                  <div className="relative mx-auto max-w-40">
                    <img
                      src={avatar.imagen}
                      alt={avatar.nombre}
                      className="aspect-square w-full rounded-full border-4 border-white object-cover shadow-sm"
                    />
                    {seleccionado && (
                      <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#d45c9c] text-sm font-black text-white shadow-md">
                        ✓
                      </span>
                    )}
                  </div>

                  <span className="mt-3 block text-sm font-bold text-[#59436d]">
                    {avatar.nombre}
                  </span>

                  {seleccionado && (
                    <span className="mt-1 block text-xs font-extrabold text-[#b84786]">
                      Seleccionado
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-7 rounded-[1.7rem] border border-[#e4dcf3] bg-white p-6 shadow-[0_12px_35px_rgba(177,135,179,0.09)] sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eee8fc] text-2xl">
              📷
            </div>
            <div>
              <h2 className="text-xl font-black text-[#7958a7]">
                Usa tu propia fotografía
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#81748d]">
                Puedes subir una imagen JPG, PNG o WEBP de hasta 5 MB.
              </p>
            </div>
          </div>

          <label className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-[#8061b0] to-[#a27bcb] px-6 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
            {guardando ? "Guardando..." : "Subir mi fotografía"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={subirFotografia}
              disabled={guardando}
              className="hidden"
            />
          </label>
        </section>

        {mensaje && (
          <div className="mt-6 rounded-2xl border border-[#eadcf0] bg-white/90 p-4 text-sm font-semibold text-[#695477] shadow-sm">
            {mensaje}
          </div>
        )}

        {guardando && (
          <p className="mt-4 text-center text-sm font-semibold text-[#8061b0]">
            Guardando cambios...
          </p>
        )}

        <section className="mt-7 rounded-[1.7rem] border border-[#e9dfed] bg-white p-6 shadow-[0_12px_35px_rgba(177,135,179,0.09)] sm:p-8">
          <div className="mb-6">
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#b16a9b]">
              INFORMACIÓN DE TU CUENTA
            </p>
            <h2 className="mt-2 text-xl font-black text-[#49375e] sm:text-2xl">
              Datos de usuario
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-[#fff7fb] p-5">
              <p className="text-xs font-bold text-[#a18aa9]">
                Nombre
              </p>
              <p className="mt-2 break-words font-bold text-[#59436d]">
                {usuario.nombre}
              </p>
            </div>

            <div className="rounded-2xl bg-[#f7f2fd] p-5">
              <p className="text-xs font-bold text-[#a18aa9]">
                Correo electrónico
              </p>
              <p className="mt-2 break-all font-bold text-[#59436d]">
                {usuario.correo}
              </p>
            </div>

            <div className="rounded-2xl bg-[#f1f9f5] p-5">
              <p className="text-xs font-bold text-[#a18aa9]">
                Estado de la cuenta
              </p>
              <p className={`mt-2 font-extrabold ${
                usuario.activo ? "text-green-700" : "text-red-600"
              }`}>
                {usuario.activo ? "Activa" : "Inactiva"}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#eee5f0] p-5">
            <p className="text-xs font-bold text-[#a18aa9]">
              Tipo de usuario
            </p>
            <p className="mt-2 font-bold capitalize text-[#59436d]">
              {nombreRol(usuario.rol)}
            </p>
            <p className="mt-2 text-xs text-[#9a8aa3]">
              Esta información corresponde a la cuenta con la que iniciaste sesión.
            </p>
          </div>
        </section>

        <div className="mt-7 flex flex-col justify-between gap-4 rounded-[1.7rem] border border-[#f1dceb] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:p-7">
          <div>
            <h2 className="font-black text-[#49375e]">
              ¿Terminaste de revisar tu perfil?
            </h2>
            <p className="mt-1 text-sm text-[#81748d]">
              Regresa a tu espacio de trabajo cuando quieras.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push(rutaInicio)}
              className="rounded-xl bg-gradient-to-r from-[#b45bc4] to-[#df579e] px-6 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Volver a mi panel
            </button>

            <button
              type="button"
              onClick={cerrarSesion}
              className="rounded-xl border border-[#ead6e9] bg-white px-6 py-3.5 text-sm font-bold text-[#a6538f] transition hover:bg-[#fff3f9]"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        <footer className="py-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <img
              src="/logo-material-didactico-mr.png"
              alt=""
              className="h-7 w-7 object-contain"
            />
            <p className="text-sm font-extrabold text-[#60436f]">
              Material Didáctico MR
            </p>
          </div>
          <p className="mt-2 text-xs text-[#a292ad]">
            Tu espacio personal · CAMPUS MR
          </p>
        </footer>
      </div>
    </main>
  );
}
