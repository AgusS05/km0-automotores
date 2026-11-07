import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AccionesEstado } from './AccionesEstado'
import type { EstadoTurno } from '../api/tipos'

type Cambio = (nuevo: EstadoTurno) => Promise<void>

const MANANA = '2099-01-01'
const AYER = '2000-01-01'

describe('AccionesEstado (mismas reglas que EstadoTurno.java)', () => {
  afterEach(cleanup)

  it('un turno pendiente se puede confirmar o cancelar', () => {
    render(<AccionesEstado estado="PENDIENTE" fecha={MANANA} horaInicio="10:00:00" onCambiar={vi.fn<Cambio>()} />)
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Vino' })).toBeNull()
  })

  it('un turno confirmado que ya empezó se marca como "Vino" o "No vino", y ya no se cancela', () => {
    render(<AccionesEstado estado="CONFIRMADO" fecha={AYER} horaInicio="10:00:00" onCambiar={vi.fn<Cambio>()} />)
    expect(screen.getByRole('button', { name: 'Vino' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'No vino' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Cancelar' })).toBeNull()
  })

  it('un turno en estado final no tiene acciones', () => {
    render(<AccionesEstado estado="REALIZADO" fecha={AYER} horaInicio="10:00:00" onCambiar={vi.fn<Cambio>()} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('envía el nuevo estado al hacer clic', async () => {
    const onCambiar = vi.fn<Cambio>().mockResolvedValue(undefined)
    render(<AccionesEstado estado="PENDIENTE" fecha={MANANA} horaInicio="10:00:00" onCambiar={onCambiar} />)

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onCambiar).toHaveBeenCalledWith('CONFIRMADO')
  })

  it('si el servidor rechaza el cambio, muestra el error', async () => {
    const onCambiar = vi.fn<Cambio>().mockRejectedValue(new Error('Solo el vendedor asignado puede modificar este turno.'))
    render(<AccionesEstado estado="PENDIENTE" fecha={MANANA} horaInicio="10:00:00" onCambiar={onCambiar} />)

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Solo el vendedor asignado puede modificar este turno.')
  })
})
