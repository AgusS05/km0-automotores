import type { ClaseManejo, EstadoTurno, Persona, TurnoTestDrive } from '../../api/tipos'
import { nombreEstado, nombreTransmision } from '../../utils/formato'

/** Test drives y clases de manejo en un mismo formato, para listarlos juntos. */
export interface Reserva {
  /** Única entre los dos tipos: "T-12" o "C-5" */
  clave: string
  tipo: 'TEST_DRIVE' | 'CLASE'
  id: number
  fecha: string
  horaInicio: string
  estado: EstadoTurno
  cliente: Persona
  /** Vendedor o instructor asignado */
  atiende: Persona
  /** "Toyota Corolla Cross XLI" o "Clase con caja manual" */
  detalle: string
  /** Patente de la unidad demo (solo test drive) */
  patente: string | null
  sucursalNombre: string
  observaciones: string | null
  creadoEn: string | null
}

export const nombreTipo: Record<Reserva['tipo'], string> = { TEST_DRIVE: 'Test drive', CLASE: 'Clase de manejo' }

export function desdeTestDrive(t: TurnoTestDrive): Reserva {
  return {
    clave: `T-${t.id}`, tipo: 'TEST_DRIVE', id: t.id, fecha: t.fecha, horaInicio: t.horaInicio, estado: t.estado,
    cliente: t.cliente, atiende: t.vendedor, detalle: `${t.marcaNombre} ${t.modeloNombre} ${t.versionNombre}`,
    patente: t.patente, sucursalNombre: t.sucursalNombre, observaciones: t.observaciones, creadoEn: t.creadoEn,
  }
}

export function desdeClase(c: ClaseManejo): Reserva {
  return {
    clave: `C-${c.id}`, tipo: 'CLASE', id: c.id, fecha: c.fecha, horaInicio: c.horaInicio, estado: c.estado,
    cliente: c.cliente, atiende: c.instructor, detalle: `Clase con ${nombreTransmision[c.transmision].toLowerCase()}`,
    patente: null, sucursalNombre: c.sucursalNombre, observaciones: c.observaciones, creadoEn: c.creadoEn,
  }
}

/** Minúsculas y sin tildes: "Pérez" se encuentra buscando "perez". */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

/** ¿La reserva coincide con lo buscado? Busca en cliente (nombre, email, teléfono), auto, patente y quien atiende. */
export function coincide(r: Reserva, busqueda: string): boolean {
  const q = normalizar(busqueda)
  if (!q) return true
  const texto = normalizar([
    r.cliente.nombreCompleto, r.cliente.email, r.cliente.telefono ?? '', r.detalle, r.patente ?? '', r.atiende.nombreCompleto,
  ].join(' '))
  // El teléfono se compara también sin espacios ni guiones ("3516242888" encuentra "351 624-2888")
  const soloDigitos = q.replace(/\D/g, '')
  return q.split(/\s+/).every((palabra) => texto.includes(palabra))
    || (soloDigitos.length >= 4 && (r.cliente.telefono ?? '').replace(/\D/g, '').includes(soloDigitos))
}

/** Orden cronológico: primero por día, después por hora. */
export function ordenar(reservas: Reserva[]): Reserva[] {
  return [...reservas].sort((a, b) => `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`) || a.clave.localeCompare(b.clave))
}

/** Cantidad de reservas por estado (para los filtros con contador). */
export function contarPorEstado(reservas: Reserva[]): Record<EstadoTurno, number> {
  const conteo: Record<EstadoTurno, number> = { PENDIENTE: 0, CONFIRMADO: 0, REALIZADO: 0, AUSENTE: 0, CANCELADO: 0 }
  for (const r of reservas) conteo[r.estado]++
  return conteo
}

/**
 * Arma un CSV que Excel en español abre bien: separado por ";" y con BOM para que respete las tildes.
 */
export function aCsv(reservas: Reserva[]): string {
  const celda = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v)
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const encabezado = ['Fecha', 'Hora', 'Tipo', 'Estado', 'Cliente', 'Email', 'Teléfono', 'Detalle', 'Patente', 'Sucursal', 'Atiende', 'Observaciones', 'Reservado el']
  const filas = reservas.map((r) => [
    r.fecha, r.horaInicio.slice(0, 5), nombreTipo[r.tipo], nombreEstado[r.estado], r.cliente.nombreCompleto, r.cliente.email,
    r.cliente.telefono, r.detalle, r.patente, r.sucursalNombre, r.atiende.nombreCompleto, r.observaciones,
    r.creadoEn ? r.creadoEn.slice(0, 16).replace('T', ' ') : '',
  ])
  return '﻿' + [encabezado, ...filas].map((f) => f.map(celda).join(';')).join('\r\n')
}
