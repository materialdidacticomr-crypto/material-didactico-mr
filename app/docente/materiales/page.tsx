"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getCurrentUser, UsuarioActual } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type Grupo = {
  id: string;
  nombre: string;
  nivel: string | null;
  seccion: string | null;
};

type Material = {
  id: string;
  docente_id: string;
  grupo_id: string | null;
  titulo: string;
  tipo: string;
  asignatura: string | null;
  descripcion: string | null;
  fecha_uso: string | null;
  created_at: string;
};

const TIPOS_MATERIAL = [
  "Folleto",
  "Ficha de trabajo",
  "Libro",
  "Video",
  "Presentación",
  "Material concreto",
  "Recurso digital",
  "Evaluación",
  "Otro",
];

const ASIGNATURAS = [
  "Español",
  "Matemáticas",
  "Ciencias",
  "Estudios Sociales",
  "Inglés",
  "Educación Especial",
  "Otra",
];

const FORMULARIO_VACIO = {
  titulo: "",
  tipo: "Ficha de trabajo",
  grupo_id: "",
  asignatura: "",
  descripcion: "",
  fecha_uso: "",
};

function fechaLegible(fecha: string | null) {
  if (!fecha) return "Sin fecha de uso";
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function MaterialesDocentePage() {
  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [materialEditando, setMaterialEditando] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function iniciar() {
      const usuarioActual = await getCurrentUser();

      if (!activo) return;

      if (!usuarioActual || !usuarioActual.activo) {
        window.location.href = "/login";
        return;
      }

      if (usuarioActual.rol !== "docente") {
        window.location.href = "/dashboard";
        return;
      }

      setUsuario(usuarioActual);

      const [respuestaGrupos, respuestaMateriales] = await Promise.all([
        supabase
          .from("grupos")
          .select("id, nombre, nivel, seccion")
          .eq("docente_id", usuarioActual.id)
          .order("nombre"),
        supabase
          .from("materiales_docente")
          .select("id, docente_id, grupo_id, titulo, tipo, asignatura, descripcion, fecha_uso, created_at")
          .eq("docente_id", usuarioActual.id)
          .order("created_at", { ascending: false }),
      ]);

      if (!activo) return;

      if (respuestaGrupos.error) {
        setError("No se pudieron cargar los grupos: " + respuestaGrupos.error.message);
      } else {
        setGrupos((respuestaGrupos.data ?? []) as Grupo[]);
      }

      if (respuestaMateriales.error) {
        setError("No se pudieron cargar los materiales: " + respuestaMateriales.error.message);
      } else {
        setMateriales((respuestaMateriales.data ?? []) as Material[]);
      }

      setCargando(false);
    }

    iniciar();

    return () => {
      activo = false;
    };
  }, []);

  const materialesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return materiales.filter((material) => {
      const coincideTipo = !filtroTipo || material.tipo === filtroTipo;
      const coincideGrupo = !filtroGrupo || material.grupo_id === filtroGrupo;
      const texto = [
        material.titulo,
        material.tipo,
        material.asignatura,
        material.descripcion,
        grupos.find((grupo) => grupo.id === material.grupo_id)?.nombre,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return coincideTipo && coincideGrupo && (!termino || texto.includes(termino));
    });
  }, [materiales, grupos, busqueda, filtroTipo, filtroGrupo]);

  function cambiarCampo(campo: keyof typeof FORMULARIO_VACIO, valor: string) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  function limpiarFormulario() {
    setFormulario({ ...FORMULARIO_VACIO });
    setMaterialEditando(null);
  }

  async function recargarMateriales(docenteId: string) {
    const { data, error: errorCarga } = await supabase
      .from("materiales_docente")
      .select("id, docente_id, grupo_id, titulo, tipo, asignatura, descripcion, fecha_uso, created_at")
      .eq("docente_id", docenteId)
      .order("created_at", { ascending: false });

    if (errorCarga) {
      setError("El material se guardó, pero no se pudo actualizar la lista: " + errorCarga.message);
      return;
    }

    setMateriales((data ?? []) as Material[]);
  }

  async function guardarMaterial(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!usuario) return;

    setMensaje("");
    setError("");

    if (!formulario.titulo.trim()) {
      setError("Escribí el nombre del material.");
      return;
    }

    setGuardando(true);

    const datos = {
      docente_id: usuario.id,
      grupo_id: formulario.grupo_id || null,
      titulo: formulario.titulo.trim(),
      tipo: formulario.tipo,
      asignatura: formulario.asignatura || null,
      descripcion: formulario.descripcion.trim() || null,
      fecha_uso: formulario.fecha_uso || null,
    };

    const respuesta = materialEditando
      ? await supabase
          .from("materiales_docente")
          .update(datos)
          .eq("id", materialEditando)
          .eq("docente_id", usuario.id)
      : await supabase.from("materiales_docente").insert(datos);

    setGuardando(false);

    if (respuesta.error) {
      setError("No se pudo guardar el material: " + respuesta.error.message);
      return;
    }

    setMensaje(materialEditando ? "Material actualizado correctamente." : "Material registrado correctamente.");
    limpiarFormulario();
    await recargarMateriales(usuario.id);
  }

  function editarMaterial(material: Material) {
    setFormulario({
      titulo: material.titulo,
      tipo: material.tipo,
      grupo_id: material.grupo_id || "",
      asignatura: material.asignatura || "",
      descripcion: material.descripcion || "",
      fecha_uso: material.fecha_uso || "",
    });
    setMaterialEditando(material.id);
    setMensaje("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function eliminarMaterial(id: string) {
    if (!usuario) return;

    const confirmar = window.confirm("¿Deseás eliminar este material?");
    if (!confirmar) return;

    setMensaje("");
    setError("");

    const { error: errorEliminar } = await supabase
      .from("materiales_docente")
      .delete()
      .eq("id", id)
      .eq("docente_id", usuario.id);

    if (errorEliminar) {
      setError("No se pudo eliminar el material: " + errorEliminar.message);
      return;
    }

    setMensaje("Material eliminado correctamente.");
    await recargarMateriales(usuario.id);
  }

  function nombreGrupo(grupoId: string | null) {
    if (!grupoId) return "Sin grupo asignado";
    const grupo = grupos.find((item) => item.id === grupoId);
    if (!grupo) return "Grupo";
    return `${grupo.nombre}${grupo.nivel ? ` · ${grupo.nivel}` : ""}${grupo.seccion ? ` · ${grupo.seccion}` : ""}`;
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FFF9FC]">
        <p className="font-semibold text-[#765D83]">Cargando Materiales...</p>
      </main>
    );
  }

  if (!usuario) return null;

  return (
    <main className="min-h-screen bg-[#FFF9FC] p-4 text-[#49375E] sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-[#49375E] via-[#76509A] to-[#C45B9A] p-6 text-white shadow-lg sm:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-purple-100">
                CAMPUS MR 2.0 · Área docente
              </p>
              <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Materiales</h1>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              <span aria-hidden="true">←</span>
              Volver al dashboard
            </Link>
          </div>
          <p className="max-w-3xl text-purple-100">
            Organizá los recursos y materiales que utilizás en tus clases, vinculándolos con tus grupos y asignaturas.
          </p>
          <div className="mt-5 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">
            {materiales.length} materiales registrados
          </div>
        </header>

        {mensaje && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 font-medium text-green-800">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-3xl border border-[#F0DCEB] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold">
                {materialEditando ? "Editar material" : "Registrar material"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Anotá los recursos que utilizás en tu trabajo docente.
              </p>
            </div>
            {materialEditando && (
              <button
                type="button"
                onClick={limpiarFormulario}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar edición
              </button>
            )}
          </div>

          <form onSubmit={guardarMaterial} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nombre del material *
                </label>
                <input
                  required
                  value={formulario.titulo}
                  onChange={(evento) => cambiarCampo("titulo", evento.target.value)}
                  placeholder="Ej. Fichas de comprensión lectora"
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 outline-none focus:border-[#C45B9A]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Tipo de material *
                </label>
                <select
                  required
                  value={formulario.tipo}
                  onChange={(evento) => cambiarCampo("tipo", evento.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 outline-none focus:border-[#C45B9A]"
                >
                  {TIPOS_MATERIAL.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Grupo
                </label>
                <select
                  value={formulario.grupo_id}
                  onChange={(evento) => cambiarCampo("grupo_id", evento.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 outline-none focus:border-[#C45B9A]"
                >
                  <option value="">Sin grupo específico</option>
                  {grupos.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {nombreGrupo(grupo.id)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Asignatura
                </label>
                <select
                  value={formulario.asignatura}
                  onChange={(evento) => cambiarCampo("asignatura", evento.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 outline-none focus:border-[#C45B9A]"
                >
                  <option value="">Seleccionar asignatura</option>
                  {ASIGNATURAS.map((asignatura) => (
                    <option key={asignatura} value={asignatura}>{asignatura}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Fecha de uso (opcional)
                </label>
                <input
                  type="date"
                  value={formulario.fecha_uso}
                  onChange={(evento) => cambiarCampo("fecha_uso", evento.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 outline-none focus:border-[#C45B9A]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Descripción u observaciones
              </label>
              <textarea
                rows={3}
                value={formulario.descripcion}
                onChange={(evento) => cambiarCampo("descripcion", evento.target.value)}
                placeholder="Indicá cómo utilizás este material o qué contenido trabaja..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 outline-none focus:border-[#C45B9A]"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={guardando}
                className="rounded-xl bg-gradient-to-r from-[#A95AC0] to-[#D45C9C] px-6 py-3 font-bold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando ? "Guardando..." : materialEditando ? "Actualizar material" : "Guardar material"}
              </button>
              <button
                type="button"
                onClick={limpiarFormulario}
                className="rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Limpiar formulario
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-[#F0DCEB] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5">
            <h2 className="text-xl font-extrabold">Materiales registrados</h2>
            <p className="mt-1 text-sm text-slate-500">
              Consultá, buscá, editá o eliminá los materiales que has registrado.
            </p>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <input
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar material..."
              className="w-full rounded-xl border border-slate-200 p-3 text-slate-800 outline-none focus:border-[#C45B9A]"
            />
            <select
              value={filtroTipo}
              onChange={(evento) => setFiltroTipo(evento.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 outline-none focus:border-[#C45B9A]"
            >
              <option value="">Todos los tipos</option>
              {TIPOS_MATERIAL.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
            <select
              value={filtroGrupo}
              onChange={(evento) => setFiltroGrupo(evento.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-800 outline-none focus:border-[#C45B9A]"
            >
              <option value="">Todos los grupos</option>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>{nombreGrupo(grupo.id)}</option>
              ))}
            </select>
          </div>

          {materialesFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E8D9F0] bg-[#FFFAFD] p-10 text-center">
              <span className="text-5xl">📚</span>
              <h3 className="mt-3 font-bold text-[#49375E]">
                {materiales.length === 0 ? "Todavía no has registrado materiales" : "No hay resultados"}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {materiales.length === 0
                  ? "Cuando registres un material, aparecerá en esta lista."
                  : "Probá cambiar los filtros o el texto de búsqueda."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {materialesFiltrados.map((material) => (
                <article
                  key={material.id}
                  className="rounded-2xl border border-[#F1DFEE] bg-gradient-to-br from-[#FFFAFD] to-[#F8F4FF] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="inline-flex rounded-full bg-[#F0E5FC] px-3 py-1 text-xs font-bold text-[#8754A4]">
                        {material.tipo}
                      </span>
                      <h3 className="mt-2 break-words text-lg font-extrabold text-[#49375E]">
                        {material.titulo}
                      </h3>
                    </div>
                    <span className="text-2xl" aria-hidden="true">📘</span>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <p><strong>Grupo:</strong> {nombreGrupo(material.grupo_id)}</p>
                    {material.asignatura && <p><strong>Asignatura:</strong> {material.asignatura}</p>}
                    <p><strong>Fecha de uso:</strong> {fechaLegible(material.fecha_uso)}</p>
                  </div>

                  {material.descripcion && (
                    <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white/80 p-3 text-sm text-slate-600">
                      {material.descripcion}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => editarMaterial(material)}
                      className="rounded-lg bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700 transition hover:bg-purple-100"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarMaterial(material.id)}
                      className="rounded-lg bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100"
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
