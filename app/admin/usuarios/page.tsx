
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users,
  GraduationCap,
  UserRoundCog,
  ShieldCheck,
  Search,
  RefreshCw,
  UserPlus,
  Eye,
  EyeOff,
  Trash2,
  Activity,
  BookOpen,
  TrendingUp,
  X,
  Save,
  Filter,
} from "lucide-react";

type Rol = "admin" | "asesora" | "docente" | "estudiante";

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  activo: boolean;
  created_at?: string;
}

interface ModuloRendimiento {
  modulo_id: string;
  titulo: string;
  practicas: number;
  promedio: number;
}

interface Estudiante {
  id: string;
  nombre: string;
  correo: string;
  activo: boolean;
  created_at: string;
  practicas: number;
  promedio: number;
  mejorResultado: number;
  ultimaPractica: string | null;
  rendimientoModulos: ModuloRendimiento[];
}

interface Estadisticas {
  total: number;
  activos: number;
  inactivos: number;
  admin: number;
  asesora: number;
  docente: number;
  estudiante: number;
}

const ESTADISTICAS_INICIALES: Estadisticas = {
  total: 0,
  activos: 0,
  inactivos: 0,
  admin: 0,
  asesora: 0,
  docente: 0,
  estudiante: 0,
};

const ETIQUETAS: Record<Rol, string> = {
  admin: "Administrador",
  asesora: "Asesora",
  docente: "Docente",
  estudiante: "Estudiante",
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas>(
    ESTADISTICAS_INICIALES
  );

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [seccion, setSeccion] = useState<"usuarios" | "rendimiento">(
    "usuarios"
  );

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [rolNuevo, setRolNuevo] = useState<Rol>("estudiante");

  const [ediciones, setEdiciones] = useState<Record<string, Rol>>({});
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [estudianteAbierto, setEstudianteAbierto] = useState<string | null>(
    null
  );

  async function obtenerToken() {
    let { data } = await supabase.auth.getSession();

    if (!data.session) {
      const renovacion = await supabase.auth.refreshSession();
      data = renovacion.data;

      if (renovacion.error) {
        throw new Error("La sesión ha expirado. Inicie sesión nuevamente.");
      }
    }

    if (!data.session?.access_token) {
      throw new Error("No se encontró una sesión de administrador.");
    }

    return data.session.access_token;
  }

  async function consultarAPI(
    metodo: string,
    body?: Record<string, unknown>
  ) {
    const token = await obtenerToken();

    const respuesta = await fetch("/api/usuarios", {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "No se pudo completar la operación.");
    }

    return resultado;
  }

  async function cargarDatos() {
    setCargando(true);
    setError("");

    try {
      const resultado = await consultarAPI("GET");

      setUsuarios(resultado.usuarios || []);
      setEstudiantes(resultado.estudiantes || []);
      setEstadisticas({
        ...ESTADISTICAS_INICIALES,
        ...(resultado.estadisticas || {}),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar los datos."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      const texto = busqueda.toLowerCase();

      const coincideBusqueda =
        usuario.nombre.toLowerCase().includes(texto) ||
        usuario.correo.toLowerCase().includes(texto);

      const coincideRol =
        filtroRol === "todos" || usuario.rol === filtroRol;

      const coincideEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "activo" && usuario.activo) ||
        (filtroEstado === "inactivo" && !usuario.activo);

      return coincideBusqueda && coincideRol && coincideEstado;
    });
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  async function crearUsuario(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensaje("");
    setError("");

    if (!nombre.trim() || !correo.trim()) {
      setError("Complete el nombre y el correo electrónico.");
      return;
    }

    if (rolNuevo !== "docente" && password.length < 8) {
      setError("Utilice una contraseña de al menos 8 caracteres.");
      return;
    }

    setGuardando(true);

    try {
      const datosUsuario: Record<string, unknown> = {
        nombre: nombre.trim(),
        correo: correo.trim(),
        rol: rolNuevo,
      };

      // Los docentes reciben una invitación por correo y crean su propia contraseña.
      if (rolNuevo !== "docente") {
        datosUsuario.password = password;
      }

      await consultarAPI("POST", datosUsuario);

      setMensaje(
        rolNuevo === "docente"
          ? `Invitación enviada correctamente a ${correo.trim()}. El docente debe revisar su correo para establecer su contraseña.`
          : "Usuario creado correctamente."
      );
      setNombre("");
      setCorreo("");
      setPassword("");
      setRolNuevo("estudiante");
      setMostrarFormulario(false);

      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el usuario.");
    } finally {
      setGuardando(false);
    }
  }

  async function actualizarUsuario(
    usuario: Usuario,
    cambios: { rol?: Rol; activo?: boolean }
  ) {
    setMensaje("");
    setError("");
    setActualizando(usuario.id);

    try {
      await consultarAPI("PATCH", {
        id: usuario.id,
        ...cambios,
      });

      setMensaje("Los cambios se guardaron correctamente.");
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el usuario.");
    } finally {
      setActualizando(null);
    }
  }

  async function eliminarEstudiante(estudiante: Estudiante) {
    const confirmar = window.confirm(
      `¿Desea eliminar a ${estudiante.nombre}?\n\nSe eliminará su cuenta y sus resultados de prácticas. Esta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    setEliminando(estudiante.id);
    setMensaje("");
    setError("");

    try {
      await consultarAPI("DELETE", { id: estudiante.id });

      setMensaje("Estudiante eliminado correctamente.");
      setEstudianteAbierto(null);
      await cargarDatos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el estudiante.");
    } finally {
      setEliminando(null);
    }
  }

  function fechaTexto(fecha: string | null) {
    if (!fecha) return "Sin actividad";

    return new Date(fecha).toLocaleString("es-CR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function colorRol(rol: Rol) {
    const colores: Record<Rol, string> = {
      admin: "border-red-400/30 bg-red-500/10 text-red-300",
      asesora: "border-pink-400/30 bg-pink-500/10 text-pink-300",
      docente: "border-violet-400/30 bg-violet-500/10 text-violet-300",
      estudiante: "border-cyan-400/30 bg-cyan-500/10 text-cyan-300",
    };

    return colores[rol];
  }

  const tarjetas = [
    {
      titulo: "Usuarios registrados",
      valor: estadisticas.total,
      icono: Users,
      color: "border-blue-500",
      detalle: "Todas las cuentas",
    },
    {
      titulo: "Administradores",
      valor: estadisticas.admin,
      icono: ShieldCheck,
      color: "border-red-500",
      detalle: "Control de plataforma",
    },
    {
      titulo: "Asesoras",
      valor: estadisticas.asesora,
      icono: UserRoundCog,
      color: "border-pink-500",
      detalle: "Acompañamiento educativo",
    },
    {
      titulo: "Docentes",
      valor: estadisticas.docente,
      icono: GraduationCap,
      color: "border-violet-500",
      detalle: "Personal docente",
    },
    {
      titulo: "Estudiantes",
      valor: estadisticas.estudiante,
      icono: BookOpen,
      color: "border-cyan-500",
      detalle: "Cuentas estudiantiles",
    },
    {
      titulo: "Cuentas activas",
      valor: estadisticas.activos,
      icono: Activity,
      color: "border-emerald-500",
      detalle: `${estadisticas.inactivos} cuentas inactivas`,
    },
  ];

  return (
    <main className="space-y-8 text-slate-100">
      <section className="relative overflow-hidden rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-800 via-slate-800 to-blue-950 p-7 shadow-[0_12px_45px_rgba(255,255,255,0.07)] md:p-9">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-bold tracking-wider text-blue-300">
            <ShieldCheck size={14} />
            CENTRO DE CONTROL · USUARIOS
          </div>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                Gestión de usuarios
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Administre las cuentas, los permisos y el acceso de cada integrante
                de CAMPUS MR 2.0 desde un solo lugar.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={cargarDatos}
                disabled={cargando}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-200 transition hover:bg-blue-500/20 disabled:opacity-50"
              >
                <RefreshCw size={16} className={cargando ? "animate-spin" : ""} />
                Actualizar
              </button>

              <button
                onClick={() => setMostrarFormulario(!mostrarFormulario)}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/30 transition hover:-translate-y-0.5 hover:bg-red-500"
              >
                <UserPlus size={17} />
                Nuevo usuario
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-4 border-t border-slate-600/60 pt-5 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Plataforma</p>
              <p className="mt-1 font-bold">CAMPUS MR 2.0</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Área de gestión</p>
              <p className="mt-1 font-bold">Usuarios y permisos</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Estado del sistema</p>
              <p className="mt-1 font-bold text-emerald-400">Conectado a Supabase</p>
            </div>
          </div>
        </div>
      </section>

      {mensaje && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-blue-400">VISIÓN GENERAL</p>
            <h2 className="mt-1 text-2xl font-black">Indicadores de cuentas</h2>
            <p className="mt-1 text-sm text-slate-400">
              Distribución de usuarios registrados en la plataforma.
            </p>
          </div>
          <span className="hidden rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-400 sm:block">
            Datos de Supabase
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tarjetas.map((tarjeta) => {
            const Icono = tarjeta.icono;

            return (
              <div
                key={tarjeta.titulo}
                className={`group relative overflow-hidden rounded-2xl border border-slate-700 border-t-4 ${tarjeta.color} bg-slate-800/90 p-5 shadow-[0_8px_25px_rgba(255,255,255,0.035)] transition duration-300 hover:-translate-y-1 hover:border-slate-500 hover:shadow-[0_12px_30px_rgba(255,255,255,0.09)]`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{tarjeta.titulo}</p>
                    <p className="mt-3 text-4xl font-black tabular-nums">{cargando ? "—" : tarjeta.valor}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/10 p-3 text-blue-200 shadow-inner">
                    <Icono size={23} />
                  </div>
                </div>
                <div className="mt-5 border-t border-slate-700 pt-3 text-xs text-slate-500">
                  {tarjeta.detalle}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {mostrarFormulario && (
        <section className="rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-[0_10px_35px_rgba(255,255,255,0.05)] md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold tracking-widest text-red-400">REGISTRO DE CUENTAS</p>
              <h2 className="mt-1 text-2xl font-black">Crear nuevo usuario</h2>
            </div>
            <button
              onClick={() => setMostrarFormulario(false)}
              className="rounded-lg border border-slate-600 p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white"
              aria-label="Cerrar formulario"
            >
              <X size={19} />
            </button>
          </div>

          <form onSubmit={crearUsuario} className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Nombre completo
              </label>
              <input
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del usuario"
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Correo electrónico
              </label>
              <input
                required
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {rolNuevo !== "docente" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Contraseña inicial
                </label>
                <input
                  required
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Rol de acceso
              </label>
              <select
                value={rolNuevo}
                onChange={(e) => {
                  setRolNuevo(e.target.value as Rol);
                  setPassword("");
                }}
                className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-400"
              >
                <option value="estudiante">Estudiante</option>
                <option value="docente">Docente</option>
                <option value="asesora">Asesora</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={guardando}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                <Save size={17} />
                {guardando
                  ? rolNuevo === "docente" ? "Enviando invitación..." : "Creando cuenta..."
                  : rolNuevo === "docente" ? "Enviar invitación" : "Crear usuario"}
              </button>
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="rounded-xl border border-slate-600 px-6 py-3 font-semibold text-slate-300 transition hover:bg-slate-700"
              >
                Cancelar
              </button>
            </div>
          </form>
          <p className="mt-5 text-xs text-slate-400">
            {rolNuevo === "docente"
              ? "Se enviará un correo de invitación al docente. Desde el enlace podrá establecer su propia contraseña para ingresar a CAMPUS MR."
              : "La cuenta se creará con la contraseña inicial indicada. Comparta las credenciales de forma segura con el usuario."}
          </p>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/80 shadow-[0_10px_35px_rgba(255,255,255,0.04)]">
        <div className="border-b border-slate-700 p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-bold tracking-widest text-blue-400">DIRECTORIO GENERAL</p>
              <h2 className="mt-1 text-2xl font-black">Usuarios registrados</h2>
              <p className="mt-1 text-sm text-slate-400">
                Consulte, filtre y administre las cuentas de CAMPUS MR.
              </p>
            </div>
            <span className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-sm text-slate-300">
              {usuariosFiltrados.length} resultados
            </span>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar nombre o correo..."
                className="w-full rounded-xl border border-slate-600 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <select
                value={filtroRol}
                onChange={(e) => setFiltroRol(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-600 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-400"
              >
                <option value="todos">Todos los roles</option>
                <option value="admin">Administradores</option>
                <option value="asesora">Asesoras</option>
                <option value="docente">Docentes</option>
                <option value="estudiante">Estudiantes</option>
              </select>
            </div>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>
        </div>

        {cargando ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="mx-auto mb-3 animate-spin" size={25} />
            Consultando usuarios...
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No se encontraron usuarios con esos criterios.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Fecha de registro</th>
                  <th className="px-6 py-4">Cambiar rol</th>
                  <th className="px-6 py-4">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id} className="transition hover:bg-slate-700/30">
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{usuario.nombre || "Sin nombre"}</p>
                      <p className="mt-1 text-xs text-slate-400">{usuario.correo}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${colorRol(usuario.rol)}`}>
                        {ETIQUETAS[usuario.rol] || usuario.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 text-xs font-bold ${usuario.activo ? "text-emerald-400" : "text-slate-400"}`}>
                        <span className={`h-2 w-2 rounded-full ${usuario.activo ? "bg-emerald-400" : "bg-slate-500"}`} />
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {usuario.created_at
                        ? new Date(usuario.created_at).toLocaleDateString("es-CR")
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {usuario.rol === "admin" ? (
                        <span className="text-xs text-slate-500">Protegido</span>
                      ) : (
                        <select
                          value={ediciones[usuario.id] || usuario.rol}
                          onChange={(e) =>
                            setEdiciones((actual) => ({
                              ...actual,
                              [usuario.id]: e.target.value as Rol,
                            }))
                          }
                          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-blue-400"
                        >
                          <option value="estudiante">Estudiante</option>
                          <option value="docente">Docente</option>
                          <option value="asesora">Asesora</option>
                          <option value="admin">Administrador</option>
                        </select>
                      )}
                      {usuario.rol !== "admin" &&
                        ediciones[usuario.id] &&
                        ediciones[usuario.id] !== usuario.rol && (
                          <button
                            onClick={() => actualizarUsuario(usuario, { rol: ediciones[usuario.id] })}
                            disabled={actualizando === usuario.id}
                            className="ml-2 rounded-lg bg-blue-600 px-2 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                            title="Guardar rol"
                          >
                            <Save size={14} />
                          </button>
                        )}
                    </td>
                    <td className="px-6 py-4">
                      {usuario.rol === "admin" ? (
                        <span className="text-xs text-slate-500">Protegido</span>
                      ) : (
                        <button
                          onClick={() => actualizarUsuario(usuario, { activo: !usuario.activo })}
                          disabled={actualizando === usuario.id}
                          className={`rounded-lg border px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
                            usuario.activo
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                          }`}
                        >
                          {actualizando === usuario.id
                            ? "Guardando..."
                            : usuario.activo
                              ? "Desactivar"
                              : "Activar"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold tracking-widest text-cyan-400">SEGUIMIENTO ACADÉMICO</p>
            <h2 className="mt-1 text-2xl font-black">Rendimiento de estudiantes</h2>
            <p className="mt-1 text-sm text-slate-400">
              Resultados de prácticas y desempeño por módulo.
            </p>
          </div>

          <button
            onClick={() => setSeccion(seccion === "rendimiento" ? "usuarios" : "rendimiento")}
            className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-700"
          >
            {seccion === "rendimiento" ? "Vista de usuarios" : "Consultar rendimiento"}
          </button>
        </div>

        {seccion === "rendimiento" && (
          cargando ? (
            <div className="rounded-2xl border border-slate-700 bg-slate-800 p-10 text-center text-slate-400">
              Cargando rendimiento...
            </div>
          ) : estudiantes.length === 0 ? (
            <div className="rounded-2xl border border-slate-700 bg-slate-800 p-10 text-center text-slate-400">
              Todavía no hay estudiantes registrados.
            </div>
          ) : (
            <div className="space-y-4">
              {estudiantes.map((estudiante) => {
                const abierto = estudianteAbierto === estudiante.id;

                return (
                  <article
                    key={estudiante.id}
                    className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-[0_8px_25px_rgba(255,255,255,0.035)] transition hover:border-slate-500"
                  >
                    <div className="p-5 md:p-6">
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-black">{estudiante.nombre}</h3>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${estudiante.activo ? "bg-emerald-500/10 text-emerald-300" : "bg-slate-700 text-slate-400"}`}>
                              {estudiante.activo ? "ACTIVO" : "INACTIVO"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-400">{estudiante.correo}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setEstudianteAbierto(abierto ? null : estudiante.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20"
                          >
                            {abierto ? <EyeOff size={16} /> : <Eye size={16} />}
                            {abierto ? "Ocultar detalle" : "Ver detalle"}
                          </button>

                          <button
                            onClick={() => eliminarEstudiante(estudiante)}
                            disabled={eliminando === estudiante.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                            {eliminando === estudiante.id ? "Eliminando..." : "Eliminar"}
                          </button>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                          <p className="text-xs text-slate-400">Prácticas realizadas</p>
                          <p className="mt-2 text-3xl font-black">{estudiante.practicas}</p>
                        </div>
                        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                          <p className="text-xs text-blue-300">Promedio general</p>
                          <p className="mt-2 text-3xl font-black text-blue-300">
                            {estudiante.practicas ? `${estudiante.promedio}%` : "—"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                          <p className="text-xs text-amber-300">Mejor resultado</p>
                          <p className="mt-2 text-3xl font-black text-amber-300">
                            {estudiante.practicas ? `${estudiante.mejorResultado}%` : "—"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                          <p className="text-xs text-emerald-300">Última actividad</p>
                          <p className="mt-2 text-sm font-bold text-emerald-300">
                            {fechaTexto(estudiante.ultimaPractica)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {abierto && (
                      <div className="border-t border-slate-700 bg-slate-900/50 p-5 md:p-6">
                        <div className="mb-5 flex items-center gap-2">
                          <TrendingUp className="text-cyan-400" size={20} />
                          <h4 className="text-lg font-black">Rendimiento por módulo</h4>
                        </div>

                        {estudiante.rendimientoModulos.length === 0 ? (
                          <p className="rounded-xl border border-slate-700 bg-slate-800 p-5 text-sm text-slate-400">
                            Este estudiante todavía no ha realizado prácticas.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {estudiante.rendimientoModulos.map((modulo) => (
                              <div key={modulo.modulo_id} className="rounded-xl border border-slate-700 bg-slate-800 p-5">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                  <div>
                                    <p className="font-bold">{modulo.titulo}</p>
                                    <p className="mt-1 text-xs text-slate-400">
                                      {modulo.practicas} {modulo.practicas === 1 ? "práctica" : "prácticas"}
                                    </p>
                                  </div>
                                  <p className="text-2xl font-black text-cyan-300">{modulo.promedio}%</p>
                                </div>
                                <div className="h-3 overflow-hidden rounded-full bg-slate-700">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
                                    style={{
                                      width: `${Math.min(100, Math.max(0, modulo.promedio))}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )
        )}
      </section>

      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        CAMPUS MR 2.0 · Administración de usuarios · Material Didáctico MR
      </footer>
    </main>
  );
}
