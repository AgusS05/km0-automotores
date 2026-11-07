import { pedir, query } from './cliente'
import type {
  AuthResponse, ClaseManejo, ColorAuto, Disponibilidad, EstadoTurno, Imagen, Marca, Metricas, ModeloDetalle,
  ModeloResumen, Persona, Sucursal, TipoCarroceria, Transmision, TurnoTestDrive, Usuario, VehiculoDemo, Version,
  Combustible, Rol, CondicionesCompra, EstadoSolicitud, FormaPago, SolicitudCompra,
} from './tipos'

/**
 * Funciones para llamar a la API REST del backend, agrupadas por módulo.
 * Cada una devuelve una promesa con el DTO tipado y, si el backend responde
 * un error, la rechaza con un {@link ApiError} (status + mensaje para mostrar).
 * La documentación completa de cada endpoint está en Swagger: /swagger-ui.html
 */

// ---------------- Autenticación ----------------
/** Registro, login y datos del usuario logueado (`/api/auth`). */
export const auth = {
  /** Inicia sesión. Rechaza con status 401 si el email o la contraseña no son correctos. */
  login: (email: string, password: string) => pedir<AuthResponse>('POST', '/api/auth/login', { email, password }),
  /** Crea una cuenta de cliente. Rechaza con 409 si el email ya existe y 400 si hay campos inválidos. */
  registro: (datos: { nombre: string; apellido: string; email: string; password: string; telefono?: string }) =>
    pedir<AuthResponse>('POST', '/api/auth/registro', datos),
  /** Datos del usuario dueño del token guardado. */
  yo: () => pedir<Usuario>('GET', '/api/auth/yo'),
}

// ---------------- Catálogo (público) ----------------
export interface FiltrosCatalogo {
  marcaId?: number | null
  carroceria?: TipoCarroceria | null
  combustible?: Combustible | null
  precioMax?: number | null
  q?: string | null
  destacados?: boolean | null
}

/** Consulta pública del catálogo (no requiere login). */
export const catalogo = {
  marcas: () => pedir<Marca[]>('GET', '/api/marcas'),
  /** Modelos filtrados; los filtros vacíos se ignoran. */
  modelos: (f: FiltrosCatalogo = {}) => pedir<ModeloResumen[]>('GET', `/api/modelos${query({ ...f })}`),
  modelo: (id: number) => pedir<ModeloDetalle>('GET', `/api/modelos/${id}`),
  /** Todas las versiones, o solo las indicadas (en ese orden) para el comparador. */
  versiones: (ids?: number[]) => pedir<Version[]>('GET', `/api/versiones${ids?.length ? `?ids=${ids.join(',')}` : ''}`),
  sucursales: () => pedir<Sucursal[]>('GET', '/api/sucursales'),
}

// ---------------- Test drive ----------------
/** Reserva y gestión de test drives (`/api/test-drives`). */
export const testDrives = {
  /**
   * Horarios de un día para probar un modelo en una sucursal.
   * @param fecha día en formato ISO, ej. "2026-11-02"
   * @returns bloques de una hora con `disponible` y `lugares`; si ese día no se atiende, `motivo`
   */
  disponibilidad: (modeloId: number, sucursalId: number, fecha: string) =>
    pedir<Disponibilidad>('GET', `/api/test-drives/disponibilidad${query({ modeloId, sucursalId, fecha })}`),
  /**
   * Reserva un test drive (solo clientes). El backend asigna unidad y vendedor.
   * @returns el turno creado, en estado PENDIENTE
   * @throws {ApiError} 409 si el horario se ocupó mientras el cliente elegía; 422 si no cumple las reglas
   * @example
   * const turno = await testDrives.reservar({ modeloId: 2, sucursalId: 1, fecha: '2026-11-02', horaInicio: '10:00' })
   */
  reservar: (datos: { modeloId: number; sucursalId: number; fecha: string; horaInicio: string; observaciones?: string }) =>
    pedir<TurnoTestDrive>('POST', '/api/test-drives', datos),
  /** Turnos del cliente logueado. */
  mios: () => pedir<TurnoTestDrive[]>('GET', '/api/test-drives/mios'),
  /** El cliente cancela su turno (solo antes de que empiece). */
  cancelar: (id: number) => pedir<TurnoTestDrive>('PATCH', `/api/test-drives/${id}/cancelar`),
  /** Agenda del vendedor (o de todos, si es admin) entre dos fechas ISO. */
  agenda: (desde: string, hasta: string, filtros: { vendedorId?: number | null; sucursalId?: number | null } = {}) =>
    pedir<TurnoTestDrive[]>('GET', `/api/test-drives/agenda${query({ desde, hasta, ...filtros })}`),
  /** Turnos pendientes de hoy a pasado mañana, para llamar y confirmar. */
  alertas: () => pedir<TurnoTestDrive[]>('GET', '/api/test-drives/alertas'),
  /** Vendedor/admin: confirmar, marcar si vino o no, o cancelar. */
  cambiarEstado: (id: number, estado: EstadoTurno) => pedir<TurnoTestDrive>('PATCH', `/api/test-drives/${id}/estado`, { estado }),
}

// ---------------- Escuela de manejo ----------------
/** Escuela de manejo (`/api/clases`): mismas operaciones que el test drive, con instructor en lugar de vendedor. */
export const clases = {
  sucursales: () => pedir<Sucursal[]>('GET', '/api/clases/sucursales'),
  instructores: (sucursalId: number) => pedir<Persona[]>('GET', `/api/clases/instructores${query({ sucursalId })}`),
  disponibilidad: (sucursalId: number, fecha: string, instructorId?: number | null) =>
    pedir<Disponibilidad>('GET', `/api/clases/disponibilidad${query({ sucursalId, fecha, instructorId })}`),
  /** Reserva una clase. Si no se indica `instructorId`, el backend asigna el que tenga menos clases ese día. */
  reservar: (datos: { sucursalId: number; fecha: string; horaInicio: string; transmision: Transmision; instructorId?: number | null; observaciones?: string }) =>
    pedir<ClaseManejo>('POST', '/api/clases', datos),
  mias: () => pedir<ClaseManejo[]>('GET', '/api/clases/mias'),
  cancelar: (id: number) => pedir<ClaseManejo>('PATCH', `/api/clases/${id}/cancelar`),
  agenda: (desde: string, hasta: string, filtros: { instructorId?: number | null; sucursalId?: number | null } = {}) =>
    pedir<ClaseManejo[]>('GET', `/api/clases/agenda${query({ desde, hasta, ...filtros })}`),
  cambiarEstado: (id: number, estado: EstadoTurno) => pedir<ClaseManejo>('PATCH', `/api/clases/${id}/estado`, { estado }),
}

// ---------------- Administración ----------------
export interface ModeloForm { marcaId: number; nombre: string; tipoCarroceria: TipoCarroceria; anio: number; descripcion: string; destacado: boolean }
export interface VersionForm {
  modeloId: number; nombreVersion: string; precio: number; motor: string; potenciaCv: number | null; transmision: string
  combustible: Combustible; traccion: string; puertas: number | null; plazas: number | null
}
export interface SucursalForm { nombre: string; direccion: string; ciudad: string; telefono: string; horarioApertura: string; horarioCierre: string; cierreSabado: string | null }
export interface VehiculoForm { versionId: number; sucursalId: number; patente: string; disponible: boolean }
export interface EmpleadoForm { nombre: string; apellido: string; email: string; password: string; telefono: string; rol: Rol; sucursalId: number | null }

/** Administración (`/api/admin`, solo rol ADMIN): métricas y ABM de catálogo, sucursales, unidades y usuarios. */
export const admin = {
  /** Indicadores del período; sin fechas toma los últimos 30 días. */
  metricas: (desde?: string, hasta?: string) => pedir<Metricas>('GET', `/api/admin/metricas${query({ desde, hasta })}`),

  crearMarca: (nombre: string) => pedir<Marca>('POST', '/api/admin/marcas', { nombre }),
  editarMarca: (id: number, nombre: string) => pedir<Marca>('PUT', `/api/admin/marcas/${id}`, { nombre }),
  eliminarMarca: (id: number) => pedir<void>('DELETE', `/api/admin/marcas/${id}`),

  crearModelo: (d: ModeloForm) => pedir<ModeloDetalle>('POST', '/api/admin/modelos', d),
  editarModelo: (id: number, d: ModeloForm) => pedir<ModeloDetalle>('PUT', `/api/admin/modelos/${id}`, d),
  eliminarModelo: (id: number) => pedir<void>('DELETE', `/api/admin/modelos/${id}`),

  crearVersion: (d: VersionForm) => pedir<Version>('POST', '/api/admin/versiones', d),
  editarVersion: (id: number, d: VersionForm) => pedir<Version>('PUT', `/api/admin/versiones/${id}`, d),
  eliminarVersion: (id: number) => pedir<void>('DELETE', `/api/admin/versiones/${id}`),

  agregarImagen: (modeloId: number, d: { url: string; fuenteUrl?: string; credito?: string }) =>
    pedir<Imagen>('POST', `/api/admin/modelos/${modeloId}/imagenes`, d),
  eliminarImagen: (id: number) => pedir<void>('DELETE', `/api/admin/imagenes/${id}`),
  agregarColor: (modeloId: number, d: { nombre: string; hex: string }) =>
    pedir<ColorAuto>('POST', `/api/admin/modelos/${modeloId}/colores`, d),
  eliminarColor: (id: number) => pedir<void>('DELETE', `/api/admin/colores/${id}`),

  crearSucursal: (d: SucursalForm) => pedir<Sucursal>('POST', '/api/admin/sucursales', d),
  editarSucursal: (id: number, d: SucursalForm) => pedir<Sucursal>('PUT', `/api/admin/sucursales/${id}`, d),
  eliminarSucursal: (id: number) => pedir<void>('DELETE', `/api/admin/sucursales/${id}`),

  vehiculos: () => pedir<VehiculoDemo[]>('GET', '/api/admin/vehiculos-demo'),
  crearVehiculo: (d: VehiculoForm) => pedir<VehiculoDemo>('POST', '/api/admin/vehiculos-demo', d),
  editarVehiculo: (id: number, d: VehiculoForm) => pedir<VehiculoDemo>('PUT', `/api/admin/vehiculos-demo/${id}`, d),
  eliminarVehiculo: (id: number) => pedir<void>('DELETE', `/api/admin/vehiculos-demo/${id}`),

  usuarios: (tipo: 'empleados' | 'clientes') => pedir<Usuario[]>('GET', `/api/admin/usuarios?tipo=${tipo}`),
  crearEmpleado: (d: EmpleadoForm) => pedir<Usuario>('POST', '/api/admin/usuarios', d),
  editarEmpleado: (id: number, d: EmpleadoForm) => pedir<Usuario>('PUT', `/api/admin/usuarios/${id}`, d),
  /** Da de baja o reactiva un usuario sin borrar su historial. */
  cambiarActivo: (id: number, activo: boolean) => pedir<Usuario>('PATCH', `/api/admin/usuarios/${id}/activo`, { activo }),
}

// ---------------- Solicitudes de compra ----------------
export interface SolicitudCompraForm {
  versionId: number
  color?: string | null
  sucursalId: number
  formaPago: FormaPago
  anticipo?: number | null
  cuotas?: number | null
  entregaUsado: boolean
  usadoDescripcion?: string | null
  comentario?: string | null
}

/** Interés de compra y presupuesto orientativo (`/api/solicitudes-compra`). No hay pagos online. */
export const compras = {
  /** Tasa, plazos y anticipo mínimo de referencia (público). */
  condiciones: () => pedir<CondicionesCompra>('GET', '/api/solicitudes-compra/condiciones'),
  /**
   * Crea la solicitud (solo clientes). El backend asigna vendedor y calcula la cuota.
   * @throws {ApiError} 409 si ya hay una abierta de esa versión; 422 si la financiación no cumple las condiciones
   */
  crear: (d: SolicitudCompraForm) => pedir<SolicitudCompra>('POST', '/api/solicitudes-compra', d),
  /** Solicitudes del cliente logueado. */
  mias: () => pedir<SolicitudCompra[]>('GET', '/api/solicitudes-compra/mias'),
  /** Una solicitud (el presupuesto): la ve el cliente, el vendedor asignado o el admin. */
  obtener: (id: number) => pedir<SolicitudCompra>('GET', `/api/solicitudes-compra/${id}`),
  /** El cliente desiste (solo si está nueva o contactada). */
  cancelar: (id: number) => pedir<SolicitudCompra>('PATCH', `/api/solicitudes-compra/${id}/cancelar`),
  /** Vendedor: las suyas. Admin: todas, con filtro de sucursal. */
  listar: (filtros: { estado?: EstadoSolicitud | null; sucursalId?: number | null } = {}) =>
    pedir<SolicitudCompra[]>('GET', `/api/solicitudes-compra${query(filtros)}`),
  /** Vendedor/admin: avanzar en el embudo (contactada, reservada, vendida, descartada). */
  cambiarEstado: (id: number, estado: EstadoSolicitud) =>
    pedir<SolicitudCompra>('PATCH', `/api/solicitudes-compra/${id}/estado`, { estado }),
}
