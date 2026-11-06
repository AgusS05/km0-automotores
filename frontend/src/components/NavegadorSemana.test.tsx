import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { NavegadorSemana, lunesDe } from './NavegadorSemana'

describe('lunesDe', () => {
  it('devuelve el lunes de la semana (el domingo cuenta como fin de semana)', () => {
    expect(lunesDe('2026-11-02')).toBe('2026-11-02') // lunes
    expect(lunesDe('2026-11-05')).toBe('2026-11-02') // jueves
    expect(lunesDe('2026-11-08')).toBe('2026-11-02') // domingo
    expect(lunesDe('2026-11-01')).toBe('2026-10-26') // domingo anterior, cruza el mes
  })
})

describe('NavegadorSemana', () => {
  afterEach(cleanup)

  it('avanza y retrocede de a una semana', () => {
    const onCambio = vi.fn<(lunes: string) => void>()
    render(<NavegadorSemana desde="2026-11-02" onCambio={onCambio} />)

    fireEvent.click(screen.getByRole('button', { name: 'Semana siguiente' }))
    fireEvent.click(screen.getByRole('button', { name: 'Semana anterior' }))

    expect(onCambio.mock.calls).toEqual([['2026-11-09'], ['2026-10-26']])
  })
})
