 "use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getCurrentUser, UsuarioActual } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type MaterialBiblioteca = {
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
  coleccion: string | null;
  created_at: string;
};

export default function BibliotecaDocentePage() {
  const [usuario, setUsuario] = useState<UsuarioActual | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);
  const [materiales, setMateriales] = useState<MaterialBiblioteca[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroGrado, setFiltroGrado] = useState("Todos");
  const [filtroAsignatura, setFiltroAsignatura] = useState("Todas");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [materialSeleccionado, setMaterialSeleccionado] =
    useState<MaterialBiblioteca | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [cargandoPdf, setCargandoPdf] = useState(false);
  const [errorPdf, setErrorPdf] = useState("");
  const objectUrlRef = useRef<string>("");

  useEffect(() => {
    let activo = true;

    async function iniciar() {
      try {
        const actual = await getCurrentUser();
        if (!activo) return;

        if (!actual || !actual.activo || actual.rol !== "docente") {
          window.location.replace("/login");
          return;
        }

        setUsuario(actual);

        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError || !sessionData.session?.access_token) {
          throw new Error("Tu sesión no está disponible. Inicia sesión nuevamente.");
        }

        const respuesta = await fetch("/api/biblioteca/materiales", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          cache: "no-store",
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(resultado.error || "No se pudieron cargar los materiales.");
        }

        if (activo) setMateriales(resultado.materiales || []);
      } catch (e) {
        if (activo) {
          setError(e instanceof Error ? e.message : "Ocurrió un error al cargar la biblioteca.");
        }
      } finally {
        if (activo) {
          setCargando(false);
          setCargandoUsuario(false);
        }
      }
    }

    void iniciar();

    return () => {
      activo = false;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const grados = useMemo(
    () => Array.from(new Set(materiales.map((m) => m.grado).filter((v): v is string => Boolean(v)))).sort(),
    [materiales]
  );

  const asignaturas = useMemo(
    () => Array.from(new Set(materiales.map((m) => m.asignatura).filter((v): v is string => Boolean(v)))).sort(),
    [materiales]
  );

  const categorias = useMemo(
    () => Array.from(new Set(materiales.map((m) => m.categoria).filter((v): v is string => Boolean(v)))).sort(),
    [materiales]
  );

  const materialesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase();
    return materiales.filter((m) => {
      const texto = [
        m.titulo, m.descripcion, m.grado, m.nivel, m.asignatura,
        m.servicio, m.categoria, m.coleccion,
      ].filter(Boolean).join(" ").toLocaleLowerCase();

      return (
        (!termino || texto.includes(termino)) &&
        (filtroGrado === "Todos" || m.grado === filtroGrado) &&
        (filtroAsignatura === "Todas" || m.asignatura === filtroAsignatura) &&
        (filtroCategoria === "Todas" || m.categoria === filtroCategoria)
      );
    });
  }, [materiales, busqueda, filtroGrado, filtroAsignatura, filtroCategoria]);

  async function visualizarMaterial(material: MaterialBiblioteca) {
    setMaterialSeleccionado(material);
    setErrorPdf("");
    setCargandoPdf(true);
    setPdfUrl("");

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }

    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (sessionError || !token) {
        throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
      }

      const respuesta = await fetch(`/api/biblioteca/material/${encodeURIComponent(material.id)}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!respuesta.ok) {
        const resultado = await respuesta.json().catch(() => null);
        throw new Error(resultado?.error || "No se pudo abrir este documento.");
      }

      const blob = await respuesta.blob();
      const nuevaUrl = URL.createObjectURL(blob);
      objectUrlRef.current = nuevaUrl;
      setPdfUrl(nuevaUrl);
    } catch (e) {
      setErrorPdf(e instanceof Error ? e.message : "No se pudo abrir el documento.");
    } finally {
      setCargandoPdf(false);
    }
  }

  function cerrarVisor() {
    setMaterialSeleccionado(null);
    setPdfUrl("");
    setErrorPdf("");
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }
  }

  function imprimirDocumento() {
    if (!pdfUrl) return;
    const ventana = window.open(pdfUrl, "_blank", "noopener,noreferrer");
    if (!ventana) {
      setErrorPdf("El navegador bloqueó la ventana. Permite las ventanas emergentes para imprimir.");
    }
  }

  if (cargandoUsuario || cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FFF9FC] p-6">
        <p className="font-semibold text-[#765D83]">Cargando Biblioteca MR...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFF9FC] px-4 py-6 text-[#49375E] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-[#49375E] via-[#76518B] to-[#C05D9B] p-6 text-white shadow-lg sm:p-8">
          <Link href="/dashboard" className="inline-flex rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold hover:bg-white/10">
            ← Volver al panel docente
          </Link>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-pink-100">MATERIAL DIDÁCTICO MR</p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">Biblioteca MR</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/85">
                Consulta los materiales educativos publicados por Administración.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3">
              <p className="text-xs text-white/75">Materiales disponibles</p>
              <p className="mt-1 text-3xl font-black">{materiales.length}</p>
            </div>
          </div>
          {usuario && <p className="mt-4 text-sm text-white/80">Docente: {usuario.nombre}</p>}
        </header>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <section className="rounded-3xl border border-[#F0DCEB] bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-extrabold">Buscar materiales</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, grado o tema..."
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-purple-400 sm:col-span-2"
            />
            <select value={filtroGrado} onChange={(e) => setFiltroGrado(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option value="Todos">Todos los grados</option>
              {grados.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={filtroAsignatura} onChange={(e) => setFiltroAsignatura(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option value="Todas">Todas las asignaturas</option>
              {asignaturas.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <option value="Todas">Todas las categorías</option>
              {categorias.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <p className="mt-4 text-sm text-slate-500">Mostrando {materialesFiltrados.length} de {materiales.length} materiales publicados.</p>
        </section>

        {materialesFiltrados.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-[#E8D9F0] bg-white p-12 text-center">
            <div className="text-5xl">📚</div>
            <h2 className="mt-4 text-xl font-extrabold">No hay materiales disponibles</h2>
            <p className="mt-2 text-sm text-slate-500">Cuando Administración publique materiales, aparecerán aquí.</p>
          </section>
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {materialesFiltrados.map((material) => (
              <article key={material.id} className="overflow-hidden rounded-3xl border border-[#F0DCEB] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                {material.portada_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={material.portada_url} alt={`Portada de ${material.titulo}`} className="h-44 w-full bg-slate-50 object-cover" />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-gradient-to-br from-[#F8E4F0] to-[#EEE8FC] text-6xl">📘</div>
                )}
                <div className="p-5">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {material.categoria && <span className="rounded-full bg-purple-50 px-3 py-1 font-semibold text-purple-700">{material.categoria}</span>}
                    {material.coleccion && <span className="rounded-full bg-pink-50 px-3 py-1 font-semibold text-pink-700">{material.coleccion}</span>}
                  </div>
                  <h3 className="mt-3 text-lg font-extrabold">{material.titulo}</h3>
                  {material.descripcion && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{material.descripcion}</p>}
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                    {material.grado && <span>{material.grado}</span>}
                    {material.asignatura && <span>{material.asignatura}</span>}
                    {material.servicio && <span>{material.servicio}</span>}
                  </div>
                  <button onClick={() => void visualizarMaterial(material)} className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#A95AC0] to-[#D45C9C] px-4 py-3 text-sm font-bold text-white shadow-sm hover:opacity-90">
                    Ver material →
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {materialSeleccionado && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/80 p-2 sm:p-5">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 rounded-t-2xl bg-white p-4">
            <div className="min-w-0">
              <h2 className="truncate font-extrabold text-[#49375E]">{materialSeleccionado.titulo}</h2>
              <p className="text-xs text-slate-500">Vista de consulta · Marca de agua Material Didáctico MR</p>
            </div>
            <div className="flex gap-2">
              <button onClick={imprimirDocumento} disabled={!pdfUrl} className="rounded-xl bg-[#A95AC0] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Imprimir</button>
              <button onClick={cerrarVisor} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">Cerrar</button>
            </div>
          </div>
          <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 items-center justify-center overflow-hidden rounded-b-2xl bg-slate-200">
            {cargandoPdf ? (
              <p className="p-8 font-semibold text-slate-600">Preparando documento con marca de agua...</p>
            ) : errorPdf ? (
              <p className="p-8 text-center font-semibold text-red-700">{errorPdf}</p>
            ) : pdfUrl ? (
              <iframe title={`Vista previa de ${materialSeleccionado.titulo}`} src={pdfUrl} className="h-full w-full bg-white" />
            ) : (
              <p className="p-8 text-slate-600">No se pudo cargar el documento.</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
