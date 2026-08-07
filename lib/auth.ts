import { supabase } from "./supabase";

export interface UsuarioActual {
  id: string;
  nombre: string;
  correo: string;
  rol: "admin" | "asesora" | "estudiante";
  activo: boolean;
}

export async function getCurrentUser(): Promise<UsuarioActual | null> {

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  console.log("========== AUTH ==========");
  console.log(authError);
  console.log(user);

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", user.id)
    .single();

  console.log("========== USUARIO ==========");
  console.log(data);
  console.log(error);

  if (error) {
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    nombre: data.nombre,
    correo: data.correo,
    rol: data.rol,
    activo: data.activo,
  };

}

export async function cerrarSesion() {

  await supabase.auth.signOut();

}