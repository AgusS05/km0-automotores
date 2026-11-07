import type { Combustible, EstadoSolicitud, EstadoTurno, FormaPago, TipoCarroceria, Transmision, Rol } from '../api/tipos'

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

/** Precio en pesos sin decimales ("$ 41.500.000"); "Consultar" si no hay precio. */
export function precio(valor: number | null | undefined): string {
  return valor == null ? 'Consultar' : pesos.format(valor)
}

/** "10:00:00" → "10:00" */
export function hora(h: string): string {
  return h.slice(0, 5)
}

/** Fecha local en formato ISO "2026-11-02" (sin pasar por UTC, que en Argentina corre el día). */
export function isoLocal(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${dia}`
}

/** "2026-11-02" → Date a las 00:00 locales */
export function desdeIso(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}

/** Suma (o resta) días a una fecha ISO: sumarDias("2026-10-30", 3) → "2026-11-02". */
export function sumarDias(iso: string, dias: number): string {
  const d = desdeIso(iso)
  d.setDate(d.getDate() + dias)
  return isoLocal(d)
}

/** Fecha de hoy en formato ISO, según la hora local del navegador. */
export function hoyIso(): string {
  return isoLocal(new Date())
}

/** "lunes 2 de noviembre" */
export function fechaLarga(iso: string): string {
  return desdeIso(iso).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** "lun 2/11" */
export function fechaCorta(iso: string): string {
  const d = desdeIso(iso)
  const dia = d.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')
  return `${dia} ${d.getDate()}/${d.getMonth() + 1}`
}

export const nombreCarroceria: Record<TipoCarroceria, string> = {
  SEDAN: 'Sedán', HATCHBACK: 'Hatchback', SUV: 'SUV', PICKUP: 'Pickup',
}

export const nombreCombustible: Record<Combustible, string> = {
  NAFTA: 'Nafta', DIESEL: 'Diésel', HIBRIDO: 'Híbrido', ELECTRICO: 'Eléctrico',
}

export const nombreEstado: Record<EstadoTurno, string> = {
  PENDIENTE: 'Pendiente', CONFIRMADO: 'Confirmado', REALIZADO: 'Realizado', AUSENTE: 'No vino', CANCELADO: 'Cancelado',
}

export const nombreTransmision: Record<Transmision, string> = {
  MANUAL: 'Caja manual', AUTOMATICA: 'Caja automática',
}

export const nombreRol: Record<Rol, string> = {
  CLIENTE: 'Cliente', VENDEDOR: 'Vendedor', INSTRUCTOR: 'Instructor', ADMIN: 'Administrador',
}

/** ¿El turno ya empezó? (para no ofrecer cancelar uno pasado) */
export function yaEmpezo(fecha: string, horaInicio: string): boolean {
  const [h, m] = horaInicio.split(':').map(Number)
  const d = desdeIso(fecha)
  d.setHours(h, m, 0, 0)
  return d.getTime() <= Date.now()
}

/** ¿La sucursal atiende ese día? Domingos no; sábados solo si tiene horario de sábado. */
export function atiendeEseDia(s: { cierreSabado: string | null }, fecha: string): boolean {
  const dia = desdeIso(fecha).getDay()
  if (dia === 0) return false
  if (dia === 6) return s.cierreSabado != null
  return true
}

/** "10:00:00" + 60 → "11:00" */
export function sumarMinutos(h: string, minutos: number): string {
  const [hh, mm] = h.split(':').map(Number)
  const total = hh * 60 + mm + minutos
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export const nombreFormaPago: Record<FormaPago, string> = {
  CONTADO: 'Contado', FINANCIADO: 'Financiado', PLAN_AHORRO: 'Plan de ahorro',
}

export const nombreEstadoSolicitud: Record<EstadoSolicitud, string> = {
  NUEVA: 'Nueva', CONTACTADA: 'Contactada', RESERVADA: 'Unidad reservada', VENDIDA: 'Vendida', DESCARTADA: 'Descartada',
}
