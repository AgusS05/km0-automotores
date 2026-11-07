import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  atiendeEseDia, desdeIso, fechaCorta, hora, isoLocal, precio, sumarDias, sumarMinutos, yaEmpezo,
} from './formato'

describe('precio', () => {
  it('formatea pesos argentinos sin decimales', () => {
    expect(precio(41500000)).toMatch(/\$\s?41\.500\.000/)
  })

  it('muestra "Consultar" si no hay precio', () => {
    expect(precio(null)).toBe('Consultar')
    expect(precio(undefined)).toBe('Consultar')
  })
})

describe('fechas sin pasar por UTC', () => {
  it('isoLocal y desdeIso son inversas', () => {
    expect(isoLocal(desdeIso('2026-11-02'))).toBe('2026-11-02')
  })

  it('sumarDias cruza fin de mes y de año', () => {
    expect(sumarDias('2026-10-30', 3)).toBe('2026-11-02')
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01')
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('fechaCorta muestra día y mes', () => {
    expect(fechaCorta('2026-11-02')).toMatch(/2\/11$/)
  })
})

describe('horas', () => {
  it('hora recorta los segundos', () => {
    expect(hora('10:00:00')).toBe('10:00')
  })

  it('sumarMinutos calcula el fin del turno', () => {
    expect(sumarMinutos('10:00:00', 60)).toBe('11:00')
    expect(sumarMinutos('18:30', 45)).toBe('19:15')
  })
})

describe('atiendeEseDia', () => {
  const conSabado = { cierreSabado: '13:00:00' }
  const sinSabado = { cierreSabado: null }

  it('de lunes a viernes atiende siempre', () => {
    expect(atiendeEseDia(sinSabado, '2026-11-02')).toBe(true) // lunes
    expect(atiendeEseDia(sinSabado, '2026-11-06')).toBe(true) // viernes
  })

  it('los sábados solo si la sucursal tiene horario de sábado', () => {
    expect(atiendeEseDia(conSabado, '2026-11-07')).toBe(true)
    expect(atiendeEseDia(sinSabado, '2026-11-07')).toBe(false)
  })

  it('los domingos nunca', () => {
    expect(atiendeEseDia(conSabado, '2026-11-08')).toBe(false)
  })
})

describe('yaEmpezo', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('compara la fecha y hora del turno con el reloj actual', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 2, 10, 30)) // 2/11/2026 10:30 local

    expect(yaEmpezo('2026-11-02', '10:00:00')).toBe(true)
    expect(yaEmpezo('2026-11-02', '10:30:00')).toBe(true)
    expect(yaEmpezo('2026-11-02', '11:00:00')).toBe(false)
    expect(yaEmpezo('2026-11-03', '09:00:00')).toBe(false)
  })
})
