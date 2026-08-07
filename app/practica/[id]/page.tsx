import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PracticaClient from "./PracticaClient";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function PracticaPage({ params }: Props) {

  const { id } = await params;

  const { data: modulo } = await supabase
    .from("modulos")
    .select("*")
    .eq("id", id)
    .single();

  if (!modulo) {
    notFound();
  }

  const { data: preguntas } = await supabase
    .from("preguntas")
    .select("*")
    .eq("modulo_id", id)
    .eq("activo", true)
    .order("orden");

  return (

    <PracticaClient
      modulo={modulo}
      preguntas={preguntas ?? []}
    />

  );

}