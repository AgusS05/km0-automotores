// Tipos que reflejan los DTOs del backend (paquete com.km0automotores.dto).
// Fechas llegan como "2026-11-02" y horas como "10:00:00".

export type Rol = 'CLIENTE' | 'VENDEDOR' | 'INSTRUCTOR' | 'ADMIN'
export type TipoCarroceria = 'SEDAN' | 'HATCHBACK' | 'SUV' | 'PICKUP'
export type Combustible = 'NAFTA' | 'DIESEL' | 'HIBRIDO' | 'ELECTRICO'
export type EstadoTurno = 'PENDIENTE' | 'CONFIRMADO' | 'REALIZADO' | 'AUSENTE' | 'CANCELADO'
export type Transmision = 'MANUAL' | 'AUTOMATICA'

export interface Usuario {
  id: number
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  rol: Rol
  sucursalId: number | null
  sucursalNombre: string | null
  activo: boolean
}

export interface AuthResponse {
  token: string
  usuario: Usuario
}

export interface Marca {
  id: number
  nombre: string
  cantidadModelos: number
}

export interface Imagen {
  id: number
  url: string
  fuenteUrl: string | null
  credito: string | null
  orden: number
}

export interface ColorAuto {
  id: number
  nombre: string
  hex: string
}

export interface Version {
  id: number
  modeloId: number
  modeloNombre: string
  marcaNombre: string
  tipoCarroceria: TipoCarroceria
  nombreVersion: string
  precio: number
  motor: string | null
  potenciaCv: number | null
  transmision: string | null
  combustible: Combustible
  traccion: string | null
  puertas: number | null
  plazas: number | null
  imagenUrl: string | null
}

export interface ModeloResumen {
  id: number
  nombre: string
  marcaId: number
  marcaNombre: string
  tipoCarroceria: TipoCarroceria
  anio: number
  precioDesde: number | null
  imagenUrl: string | null
  combustibles: Combustible[]
  cantidadVersiones: number
  destacado: boolean
}

export interface Sucursal {
  id: number
  nombre: string
  direccion: string
  ciudad: string
  telefono: string | null
  horarioApertura: string
  horarioCierre: string
  cierreSabado: string | null
}

export interface ModeloDetalle {
  id: number
  nombre: string
  marcaId: number
  marcaNombre: string
  tipoCarroceria: TipoCarroceria
  anio: number
  descripcion: string | null
  destacado: boolean
  precioDesde: number | null
  versiones: Version[]
  imagenes: Imagen[]
  colores: ColorAuto[]
  sucursalesConDemo: Sucursal[]
}

export interface Horario {
  hora: string
  disponible: boolean
  lugares: number
}

export interface Disponibilidad {
  fecha: string
  sucursalId: number
  horarios: Horario[]
  motivo: string | null
}

export interface Persona {
  id: number
  nombreCompleto: string
  email: string
  telefono: string | null
}

export interface TurnoTestDrive {
  id: number
  fecha: string
  horaInicio: string
  horaFin: string
  estado: EstadoTurno
  modeloId: number
  modeloNombre: string
  marcaNombre: string
  versionNombre: string
  patente: string
  sucursalId: number
  sucursalNombre: string
  sucursalDireccion: string
  cliente: Persona
  vendedor: Persona
  observaciones: string | null
  creadoEn: string | null
}

export interface ClaseManejo {
  id: number
  fecha: string
  horaInicio: string
  horaFin: string
  estado: EstadoTurno
  transmision: Transmision
  sucursalId: number
  sucursalNombre: string
  sucursalDireccion: string
  cliente: Persona
  instructor: Persona
  observaciones: string | null
  creadoEn: string | null
}

export interface VehiculoDemo {
  id: number
  patente: string
  disponible: boolean
  versionId: number
  versionNombre: string
  modeloId: number
  modeloNombre: string
  marcaNombre: string
  sucursalId: number
  sucursalNombre: string
}

export interface Conteo {
  etiqueta: string
  cantidad: number
}

export interface Metricas {
  desde: string
  hasta: string
  totalTestDrives: number
  testDrivesPorEstado: Record<EstadoTurno, number>
  tasaAsistencia: number | null
  sinConfirmar: number
  porModelo: Conteo[]
  porHorario: Conteo[]
  porSucursal: Conteo[]
  totalClases: number
  clasesPorEstado: Record<EstadoTurno, number>
  clasesPorInstructor: Conteo[]
}

export interface ErrorApi {
  status: number
  mensaje: string
  campos: Record<string, string>
}

// ---------------- Solicitudes de compra ----------------
export type FormaPago = 'CONTADO' | 'FINANCIADO' | 'PLAN_AHORRO'
export type EstadoSolicitud = 'NUEVA' | 'CONTACTADA' | 'RESERVADA' | 'VENDIDA' | 'DESCARTADA'

export interface CondicionesCompra {
  /** Tasa nominal anual de referencia, en % */
  tnaReferencia: number
  cuotas: number[]
  anticipoMinimoPorcentaje: number
}

export interface SolicitudCompra {
  id: number
  estado: EstadoSolicitud
  creadoEn: string
  actualizadoEn: string
  cliente: Persona
  vendedor: Persona
  modeloId: number
  marcaNombre: string
  modeloNombre: string
  tipoCarroceria: TipoCarroceria
  versionId: number
  versionNombre: string
  motor: string | null
  transmision: string | null
  combustible: Combustible
  imagenUrl: string | null
  color: string | null
  colorHex: string | null
  sucursalId: number
  sucursalNombre: string
  sucursalDireccion: string
  sucursalTelefono: string | null
  formaPago: FormaPago
  precioLista: number
  anticipo: number | null
  cuotas: number | null
  tnaReferencia: number | null
  montoFinanciado: number | null
  cuotaEstimada: number | null
  totalCuotas: number | null
  entregaUsado: boolean
  usadoDescripcion: string | null
  comentario: string | null
}
