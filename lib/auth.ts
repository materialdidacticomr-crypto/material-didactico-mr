
import { supabase } from "./supabase";

export interface UsuarioActual {
  id: string;
  nombre: string;
  correo: string;
  rol: "admin" | "asesora" | "estudiante" | "docente";
  activo: boolean;
}

export async function getCurrentUser(): Promise<UsuarioActual | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre, correo, rol, activo")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    nombre: data.nombre,
    correo: data.correo,
    rol: data.rol as UsuarioActual["rol"],
    activo: data.activo,
  };
}

export async function cerrarSesion() {
  await supabase.auth.signOut();
}
