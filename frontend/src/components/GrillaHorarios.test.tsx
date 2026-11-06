import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { GrillaHorarios } from './GrillaHorarios'
import type { Disponibilidad } from '../api/tipos'

const dia: Disponibilidad = {
  fecha: '2026-11-02',
  sucursalId: 1,
  motivo: null,
  horarios: [
    { hora: '09:00:00', disponible: false, lugares: 0 },
    { hora: '10:00:00', disponible: true, lugares: 1 },
    { hora: '11:00:00', disponible: true, lugares: 2 },
  ],
}

describe('GrillaHorarios', () => {
  afterEach(cleanup)

  it('muestra cuántos horarios quedan y deshabilita los ocupados', () => {
    render(<GrillaHorarios disponibilidad={dia} valor={null} onCambio={() => {}} />)

    expect(screen.getByText('2 horarios libres')).toBeTruthy()
    expect((screen.getByRole('radio', { name: /09:00/ }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole('radio', { name: /10:00\s*Último lugar/ })).toBeTruthy()
    expect(screen.getByRole('radio', { name: /11:00\s*Libre/ })).toBeTruthy()
  })

  it('al elegir un horario libre avisa cuál se eligió', () => {
    const onCambio = vi.fn<(hora: string) => void>()
    render(<GrillaHorarios disponibilidad={dia} valor={null} onCambio={onCambio} />)

    fireEvent.click(screen.getByRole('radio', { name: /11:00/ }))

    expect(onCambio).toHaveBeenCalledWith('11:00:00')
  })

  it('marca el horario seleccionado', () => {
    render(<GrillaHorarios disponibilidad={dia} valor="10:00:00" onCambio={() => {}} />)
    expect(screen.getByRole('radio', { name: /10:00/ }).getAttribute('aria-checked')).toBe('true')
  })

  it('si la sucursal no atiende, muestra el motivo en lugar de la grilla', () => {
    render(
      <GrillaHorarios
        disponibilidad={{ ...dia, horarios: [], motivo: 'La sucursal no atiende los domingos.' }}
        valor={null}
        onCambio={() => {}}
      />,
    )
    expect(screen.getByText('La sucursal no atiende los domingos.')).toBeTruthy()
    expect(screen.queryByRole('radiogroup')).toBeNull()
  })
})
