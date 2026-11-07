import { describe, expect, it } from 'vitest'
import type { ClaseManejo, TurnoTestDrive } from '../../api/tipos'
import { aCsv, coincide, contarPorEstado, desdeClase, desdeTestDrive, normalizar, ordenar } from './reservas'

const persona = (nombreCompleto: string, email: string, telefono: string | null = null) => ({ id: 1, nombreCompleto, email, telefono })

const testDrive: TurnoTestDrive = {
  id: 7, fecha: '2026-11-03', horaInicio: '10:00:00', horaFin: '11:00:00', estado: 'PENDIENTE',
  modeloId: 2, modeloNombre: 'Corolla Cross', marcaNombre: 'Toyota', versionNombre: 'XEI', patente: 'AF123BC',
  sucursalId: 1, sucursalNombre: 'Córdoba Centro', sucursalDireccion: 'Av. Colón 1250',
  cliente: persona('Natalia Pérez', 'natalia@example.com', '351 624-2888'), vendedor: persona('Martín Ferreyra', 'martin@km0.com.ar'),
  observaciones: 'Quiero probar en ruta; si se puede', creadoEn: '2026-10-29T18:20:00',
}
const clase: ClaseManejo = {
  id: 3, fecha: '2026-11-02', horaInicio: '17:00:00', horaFin: '18:00:00', estado: 'CONFIRMADO', transmision: 'MANUAL',
  sucursalId: 1, sucursalNombre: 'Córdoba Centro', sucursalDireccion: 'Av. Colón 1250',
  cliente: persona('Juan Gómez', 'juan@example.com'), instructor: persona('Valeria Ponce', 'valeria@km0.com.ar'),
  observaciones: null, creadoEn: null,
}

describe('reservas del panel de administración', () => {
  it('unifica test drives y clases con claves que no se repiten', () => {
    const t = desdeTestDrive(testDrive)
    const c = desdeClase(clase)
    expect(t).toMatchObject({ clave: 'T-7', tipo: 'TEST_DRIVE', detalle: 'Toyota Corolla Cross XEI', atiende: { nombreCompleto: 'Martín Ferreyra' } })
    expect(c).toMatchObject({ clave: 'C-3', tipo: 'CLASE', detalle: 'Clase con caja manual', patente: null })
  })

  it('ordena por día y hora', () => {
    const lista = ordenar([desdeTestDrive(testDrive), desdeClase(clase)])
    expect(lista.map((r) => r.clave)).toEqual(['C-3', 'T-7'])
  })

  it('busca sin importar tildes ni mayúsculas, por cliente, modelo, patente o teléfono', () => {
    const r = desdeTestDrive(testDrive)
    expect(normalizar('  Pérez ')).toBe('perez')
    expect(coincide(r, 'perez')).toBe(true)
    expect(coincide(r, 'natalia corolla')).toBe(true)
    expect(coincide(r, 'af123')).toBe(true)
    expect(coincide(r, '3516242888')).toBe(true)
    expect(coincide(r, 'onix')).toBe(false)
    expect(coincide(r, '')).toBe(true)
  })

  it('cuenta las reservas por estado', () => {
    expect(contarPorEstado([desdeTestDrive(testDrive), desdeClase(clase)])).toEqual({
      PENDIENTE: 1, CONFIRMADO: 1, REALIZADO: 0, AUSENTE: 0, CANCELADO: 0,
    })
  })

  it('exporta un CSV para Excel en español (punto y coma, tildes y comillas escapadas)', () => {
    const csv = aCsv([desdeTestDrive(testDrive)])
    const [encabezado, fila] = csv.slice(1).split('\r\n')
    expect(csv.startsWith('﻿')).toBe(true)
    expect(encabezado.split(';')).toContain('Teléfono')
    expect(fila).toContain('2026-11-03;10:00;Test drive;Pendiente;Natalia Pérez')
    expect(fila).toContain('"Quiero probar en ruta; si se puede"')
    expect(fila.endsWith('2026-10-29 18:20')).toBe(true)
  })
})
