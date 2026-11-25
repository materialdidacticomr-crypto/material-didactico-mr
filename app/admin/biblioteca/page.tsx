
"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Material = {
  id: string;
  titulo: string;
  descripcion: string | null;
  nivel: string | null;
  grado: string | null;
  asignatura: string | null;
  servicio: string | null;
  tipo: string | null;
  categoria: string | null;
  portada_url: string | null;
  drive_file_id: string | null;
  drive_ruta: string | null;
  coleccion: string | null;
  activo: boolean;
  created_at: string;
};

type ResultadoSincronizacion = {
  success?: boolean;
  message?: string;
  totalDetectados?: number;
  nuevosRegistrados?: number;
  existentes?: number;
  pendientesDeAprobacion?: number;
  error?: string;
};

const CAMPO =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100";

const ETIQUETA =
  "mb-1.5 block text-sm font-semibold text-slate-700";

const CATEGORIAS = [
  "Folletos",
  "Antologías",
  "Servicios de apoyo",
  "Pendiente de clasificación",
];

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "setiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function textoNormalizado(valor: string | null | undefined) {
  return (valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function obtenerOrdenGrado(material: Material) {
  const referencia = textoNormalizado(
    `${material.grado || ""} ${material.nivel || ""} ${material.drive_ruta || ""} ${material.titulo || ""}`
  );

  if (referencia.includes("preescolar") || referencia.includes("transicion") || referencia.includes("materno")) return 0;

  const grados = [
    ["primer", 1, "1"],
    ["primero", 1, "1"],
    ["segundo", 2, "2"],
    ["tercer", 3, "3"],
    ["tercero", 3, "3"],
    ["cuarto", 4, "4"],
    ["quinto", 5, "5"],
    ["sexto", 6, "6"],
  ] as const;

  for (const [palabra, numero, digito] of grados) {
    if (referencia.includes(palabra) || referencia.includes(`${digito}.`)) {
      return numero;
    }
  }

  return 99;
}

function obtenerOrdenMes(material: Material) {
  const referencia = textoNormalizado(`${material.titulo || ""} ${material.drive_ruta || ""}`);
  const indice = MESES.findIndex((mes) => referencia.includes(mes));
  return indice === -1 ? 99 : indice;
}

function compararMateriales(a: Material, b: Material) {
  const gradoA = obtenerOrdenGrado(a);
  const gradoB = obtenerOrdenGrado(b);
  if (gradoA !== gradoB) return gradoA - gradoB;

  const mesA = obtenerOrdenMes(a);
  const mesB = obtenerOrdenMes(b);
  if (mesA !== mesB) return mesA - mesB;

  return a.titulo.localeCompare(b.titulo, "es", { numeric: true, sensitivity: "base" });
}

export default function BibliotecaAdminPage() {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [resultadoSync, setResultadoSync] =
    useState<ResultadoSincronizacion | null>(null);

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nivel, setNivel] = useState("");
  const [grado, setGrado] = useState("");
  const [asignatura, setAsignatura] = useState("");
  const [servicio, setServicio] = useState("");
  const [categoria, setCategoria] = useState("Folletos");
  const [tipo, setTipo] = useState("PDF");
  const [driveFileId, setDriveFileId] = useState("");
  const [portadaUrl, setPortadaUrl] = useState("");

  const [buscar, setBuscar] = useState("");
  const [filtroColeccion, setFiltroColeccion] = useState("Todas");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroGrado, setFiltroGrado] = useState("Todos");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const cargarMateriales = useCallback(async () => {
    setCargando(true);
    setError("");

    const { data, error: consultaError } = await supabase
      .from("biblioteca_materiales")
      .select("*")
      .order("created_at", { ascending: false });

    if (consultaError) {
      setError(consultaError.message);
      setMateriales([]);
    } else {
      setMateriales((data || []) as Material[]);
    }

    setCargando(false);
  }, []);

  useEffect(() => {
    void cargarMateriales();
  }, [cargarMateriales]);

  async function sincronizarGoogleDrive() {
    setError("");
    setMensaje("");
    setResultadoSync(null);
    setSincronizando(true);

    try {
      const {
        data: { session },
        error: errorSesion,
      } = await supabase.auth.getSession();

      if (errorSesion || !session?.access_token) {
        throw new Error(
          "No se pudo recuperar tu sesión. Inicia sesión nuevamente."
        );
      }

      const respuesta = await fetch(
        "/api/admin/biblioteca/sincronizar",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        }
      );

      const datos: ResultadoSincronizacion =
        await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error || "No se pudo sincronizar Google Drive."
        );
      }

      setResultadoSync(datos);
      setMensaje(datos.message || "Sincronización completada.");

      await cargarMateriales();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error durante la sincronización."
      );
    } finally {
      setSincronizando(false);
    }
  }

  async function registrarMaterial(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMensaje("");
    setError("");

    if (!titulo.trim() || !driveFileId.trim()) {
      setError("Completa el nombre y el ID del archivo de Drive.");
      return;
    }

    setGuardando(true);

    const { error: insertarError } = await supabase
      .from("biblioteca_materiales")
      .insert({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        nivel: nivel.trim() || null,
        grado: grado.trim() || null,
        asignatura: asignatura.trim() || null,
        servicio: servicio.trim() || null,
        categoria,
        tipo,
        drive_file_id: driveFileId.trim(),
        portada_url: portadaUrl.trim() || null,
        activo: false,
      });

    if (insertarError) {
      setError(
        `No se pudo registrar el material: ${insertarError.message}`
      );
      setGuardando(false);
      return;
    }

    setTitulo("");
    setDescripcion("");
    setNivel("");
    setGrado("");
    setAsignatura("");
    setServicio("");
    setCategoria("Folletos");
    setTipo("PDF");
    setDriveFileId("");
    setPortadaUrl("");

    setMensaje(
      "Material registrado como oculto. Debes aprobarlo para publicarlo."
    );

    setGuardando(false);
    await cargarMateriales();
  }

  async function cambiarEstado(material: Material) {
    setError("");
    setMensaje("");

    const { error: actualizarError } = await supabase
      .from("biblioteca_materiales")
      .update({
        activo: !material.activo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", material.id);

    if (actualizarError) {
      setError(
        `No se pudo actualizar el material: ${actualizarError.message}`
      );
      return;
    }

    setMensaje(
      material.activo
        ? "Material ocultado de la biblioteca docente."
        : "Material aprobado y publicado."
    );

    await cargarMateriales();
  }

  async function cambiarCategoria(
    material: Material,
    nuevaCategoria: string
  ) {
    setError("");
    setMensaje("");

    const valor = nuevaCategoria === "Pendiente de clasificación"
      ? null
      : nuevaCategoria;

    const { error: actualizarError } = await supabase
      .from("biblioteca_materiales")
      .update({
        categoria: valor,
        updated_at: new Date().toISOString(),
      })
      .eq("id", material.id);

    if (actualizarError) {
      setError(
        `No se pudo cambiar la categoría: ${actualizarError.message}`
      );
      return;
    }

    setMensaje("Categoría actualizada correctamente.");
    await cargarMateriales();
  }

  const totalActivos = materiales.filter(
    (material) => material.activo
  ).length;

  const totalPendientes = materiales.filter(
    (material) => !material.activo
  ).length;

  const totalSinCategoria = materiales.filter(
    (material) => !material.categoria
  ).length;

  const colecciones = useMemo(
    () =>
      Array.from(
        new Set(
          materiales
            .map((material) => material.coleccion)
            .filter((valor): valor is string => Boolean(valor))
        )
      ).sort(),
    [materiales]
  );

  const grados = useMemo(
    () =>
      Array.from(
        new Set(
          materiales
            .map((material) => material.grado)
            .filter((valor): valor is string => Boolean(valor))
        )
      ).sort(),
    [materiales]
  );

  const materialesFiltrados = useMemo(() => {
    const termino = buscar.trim().toLowerCase();

    return materiales.filter((material) => {
      const coincideBusqueda =
        !termino ||
        [
          material.titulo,
          material.descripcion,
          material.grado,
          material.servicio,
          material.drive_ruta,
        ]
          .filter(Boolean)
          .some((valor) => valor!.toLowerCase().includes(termino));

      const coincideColeccion =
        filtroColeccion === "Todas" ||
        material.coleccion === filtroColeccion;

      const coincideCategoria =
        filtroCategoria === "Todas"
          ? true
          : filtroCategoria === "Pendiente de clasificación"
            ? !material.categoria
            : material.categoria === filtroCategoria;

      const coincideGrado =
        filtroGrado === "Todos" ||
        material.grado === filtroGrado;

      const coincideEstado =
        filtroEstado === "Todos" ||
        (filtroEstado === "Publicados" && material.activo) ||
        (filtroEstado === "Ocultos" && !material.activo);

      return (
        coincideBusqueda &&
        coincideColeccion &&
        coincideCategoria &&
        coincideGrado &&
        coincideEstado
      );
    });
  }, [
    materiales,
    buscar,
    filtroColeccion,
    filtroCategoria,
    filtroGrado,
    filtroEstado,
  ]);

  const materialesOrdenados = useMemo(
    () => [...materialesFiltrados].sort(compararMateriales),
    [materialesFiltrados]
  );

  function limpiarFiltros() {
    setBuscar("");
    setFiltroColeccion("Todas");
    setFiltroCategoria("Todas");
    setFiltroGrado("Todos");
    setFiltroEstado("Todos");
  }

  return (
    <main className="min-h-screen bg-[#F5F3FA] px-4 py-6 text-slate-800 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-7">

        <header className="rounded-3xl bg-gradient-to-r from-[#29243B] via-[#44365E] to-[#6B4778] p-6 text-white shadow-xl sm:p-8">
          <Link
            href="/admin"
            className="inline-flex rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
          >
            ← Volver al panel administrativo
          </Link>

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-pink-200">
                MATERIAL DIDÁCTICO MR
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                Biblioteca MR
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">
                Administra folletos, antologías y materiales de servicios
                de apoyo. Tú decides qué contenido se publica.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-3">
              <p className="text-xs font-semibold text-white/70">
                Materiales registrados
              </p>
              <p className="mt-1 text-3xl font-black">
                {materiales.length}
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {mensaje}
          </div>
        )}

        {/* SINCRONIZACIÓN */}

        <section className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold tracking-widest text-violet-600">
                CONEXIÓN CON GOOGLE DRIVE
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Sincronización automática
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Detecta PDF en las carpetas y subcarpetas. Los archivos
                nuevos quedan ocultos hasta tu aprobación.
              </p>
            </div>

            <button
              type="button"
              onClick={sincronizarGoogleDrive}
              disabled={sincronizando}
              className="shrink-0 rounded-xl bg-violet-700 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sincronizando
                ? "Sincronizando..."
                : "↻ Sincronizar Google Drive"}
            </button>
          </div>

          {resultadoSync && (
            <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50 p-5">
              <h3 className="font-extrabold text-violet-900">
                Resultado de la sincronización
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["PDF detectados", resultadoSync.totalDetectados ?? 0],
                  ["Nuevos registrados", resultadoSync.nuevosRegistrados ?? 0],
                  ["Ya existentes", resultadoSync.existentes ?? 0],
                  ["Pendientes de aprobación", resultadoSync.pendientesDeAprobacion ?? 0],
                ].map(([etiqueta, valor]) => (
                  <div key={String(etiqueta)} className="rounded-xl bg-white p-4">
                    <p className="text-xs text-slate-500">{etiqueta}</p>
                    <p className="mt-1 text-2xl font-black">{valor}</p>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-sm font-medium text-violet-800">
                {resultadoSync.message}
              </p>
            </div>
          )}
        </section>

        {/* RESUMEN */}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Publicados
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-600">
              {totalActivos}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Ocultos o pendientes
            </p>
            <p className="mt-2 text-3xl font-black text-amber-600">
              {totalPendientes}
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Sin clasificación
            </p>
            <p className="mt-2 text-3xl font-black text-violet-700">
              {totalSinCategoria}
            </p>
          </div>
        </section>

        {/* FILTROS */}

        <section className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-widest text-violet-600">
                ORGANIZACIÓN
              </p>
              <h2 className="mt-1 text-2xl font-black">
                Buscar y filtrar materiales
              </h2>
            </div>

            <button
              type="button"
              onClick={limpiarFiltros}
              className="rounded-xl border border-violet-200 px-4 py-2 text-sm font-bold text-violet-700 hover:bg-violet-50"
            >
              Limpiar filtros
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={ETIQUETA}>
                Buscar por nombre, grado o carpeta
              </label>
              <input
                className={CAMPO}
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Escribe el nombre del material..."
              />
            </div>

            <div>
              <label className={ETIQUETA}>Colección</label>
              <select
                className={CAMPO}
                value={filtroColeccion}
                onChange={(e) => setFiltroColeccion(e.target.value)}
              >
                <option value="Todas">Todas las colecciones</option>
                {colecciones.map((coleccion) => (
                  <option key={coleccion} value={coleccion}>
                    {coleccion}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={ETIQUETA}>Categoría</label>
              <select
                className={CAMPO}
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
              >
                <option value="Todas">Todas las categorías</option>
                {CATEGORIAS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={ETIQUETA}>Grado</label>
              <select
                className={CAMPO}
                value={filtroGrado}
                onChange={(e) => setFiltroGrado(e.target.value)}
              >
                <option value="Todos">Todos los grados</option>
                {grados.map((grado) => (
                  <option key={grado} value={grado}>
                    {grado}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={ETIQUETA}>Estado de publicación</label>
              <select
                className={CAMPO}
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="Todos">Todos los estados</option>
                <option value="Publicados">Publicados</option>
                <option value="Ocultos">Ocultos o pendientes</option>
              </select>
            </div>
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-600">
            Mostrando {materialesFiltrados.length} de {materiales.length} materiales.
          </p>
        </section>

        {/* REGISTRO MANUAL */}

        <section className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6">
            <p className="text-xs font-bold tracking-widest text-violet-600">
              NUEVO CONTENIDO
            </p>
            <h2 className="mt-1 text-2xl font-black">
              Registrar material educativo
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Los registros manuales también quedan ocultos hasta tu aprobación.
            </p>
          </div>

          <form onSubmit={registrarMaterial} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className={ETIQUETA}>Nombre del material *</label>
                <input
                  className={CAMPO}
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Nombre del material"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className={ETIQUETA}>Descripción</label>
                <textarea
                  className={CAMPO}
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción del material"
                />
              </div>

              <div>
                <label className={ETIQUETA}>Colección</label>
                <select
                  className={CAMPO}
                  value={filtroColeccion === "Material 2027" ? "Material 2027" : "Colección anterior"}
                  onChange={(e) => setFiltroColeccion(e.target.value)}
                >
                  <option value="Colección anterior">Colección anterior</option>
                  <option value="Material 2027">Material 2027</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  La colección se utiliza para filtrar; la clasificación de Drive se obtiene de su carpeta.
                </p>
              </div>

              <div>
                <label className={ETIQUETA}>Categoría</label>
                <select
                  className={CAMPO}
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  {CATEGORIAS.filter((item) => item !== "Pendiente de clasificación").map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={ETIQUETA}>Nivel educativo</label>
                <input
                  className={CAMPO}
                  value={nivel}
                  onChange={(e) => setNivel(e.target.value)}
                  placeholder="Ej. I Ciclo, II Ciclo"
                />
              </div>

              <div>
                <label className={ETIQUETA}>Grado</label>
                <input
                  className={CAMPO}
                  value={grado}
                  onChange={(e) => setGrado(e.target.value)}
                  placeholder="Ej. Primero, Segundo"
                />
              </div>

              <div>
                <label className={ETIQUETA}>Asignatura</label>
                <input
                  className={CAMPO}
                  value={asignatura}
                  onChange={(e) => setAsignatura(e.target.value)}
                  placeholder="Ej. Español, Matemáticas"
                />
              </div>

              <div>
                <label className={ETIQUETA}>Servicio educativo</label>
                <input
                  className={CAMPO}
                  value={servicio}
                  onChange={(e) => setServicio(e.target.value)}
                  placeholder="Ej. Aula integrada"
                />
              </div>

              <div>
                <label className={ETIQUETA}>Tipo de archivo</label>
                <select
                  className={CAMPO}
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                >
                  <option value="PDF">PDF</option>
                  <option value="Word">Word</option>
                  <option value="Imagen">Imagen</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className={ETIQUETA}>ID de Google Drive *</label>
                <input
                  className={CAMPO}
                  value={driveFileId}
                  onChange={(e) => setDriveFileId(e.target.value)}
                  placeholder="ID del archivo"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className={ETIQUETA}>URL de portada (opcional)</label>
                <input
                  className={CAMPO}
                  value={portadaUrl}
                  onChange={(e) => setPortadaUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="rounded-xl bg-violet-700 px-6 py-3 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "＋ Registrar material"}
            </button>
          </form>
        </section>

        {/* LISTADO Y APROBACIÓN */}

        <section className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold tracking-widest text-violet-600">
                REVISIÓN Y APROBACIÓN
              </p>
              <h2 className="mt-1 text-2xl font-black">
                Materiales de Biblioteca MR
              </h2>
            </div>

            <button
              type="button"
              onClick={() => void cargarMateriales()}
              disabled={cargando}
              className="rounded-xl border border-violet-200 px-4 py-2.5 text-sm font-bold text-violet-700 hover:bg-violet-50 disabled:opacity-50"
            >
              {cargando ? "Actualizando..." : "↻ Actualizar"}
            </button>
          </div>

          {cargando ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Cargando materiales...
            </p>
          ) : materialesFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
              <div className="text-4xl">📚</div>
              <p className="mt-3 font-bold text-slate-700">
                No se encontraron materiales con esos filtros.
              </p>
              <button
                type="button"
                onClick={limpiarFiltros}
                className="mt-3 text-sm font-bold text-violet-700 hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {materialesOrdenados.map((material) => (
                <article
                  key={material.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-800">
                          {material.titulo}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            material.activo
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {material.activo ? "Publicado" : "Oculto / pendiente"}
                        </span>
                      </div>

                      {material.descripcion && (
                        <p className="mt-1 text-sm text-slate-500">
                          {material.descripcion}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-violet-700">
                          {material.coleccion || "Colección sin identificar"}
                        </span>
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600">
                          {material.categoria || "Pendiente de clasificación"}
                        </span>
                        {material.grado && (
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600">
                            {material.grado}
                          </span>
                        )}
                        {material.servicio && (
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600">
                            {material.servicio}
                          </span>
                        )}
                      </div>

                      {material.drive_ruta && (
                        <p className="mt-2 break-all text-xs text-violet-600">
                          Ubicación: {material.drive_ruta}
                        </p>
                      )}

                      {material.drive_file_id && (
                        <p className="mt-1 text-xs text-slate-400">
                          Archivo vinculado a Google Drive
                        </p>
                      )}

                      <div className="mt-4 max-w-sm">
                        <label className={ETIQUETA}>
                          Corregir categoría
                        </label>
                        <select
                          className={CAMPO}
                          value={material.categoria || "Pendiente de clasificación"}
                          onChange={(e) =>
                            void cambiarCategoria(material, e.target.value)
                          }
                        >
                          {CATEGORIAS.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void cambiarEstado(material)}
                      className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                        material.activo
                          ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {material.activo
                        ? "Ocultar material"
                        : "Aprobar y publicar"}
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
