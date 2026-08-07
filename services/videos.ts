import { supabase } from "../lib/supabase";

export async function eliminarVideo(id: string) {
  const { error } = await supabase
    .from("videos")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function obtenerVideos() {
  const { data, error } = await supabase
    .from("videos")
    .select(`
      *,
      modulos(
        titulo
      )
    `)
    .order("orden");

  if (error) throw error;

  return data;
}