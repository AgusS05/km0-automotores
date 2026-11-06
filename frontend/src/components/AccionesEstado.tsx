import { useState } from 'react'
import type { EstadoTurno } from '../api/tipos'
import { yaEmpezo } from '../utils/formato'

interface Props {
  estado: EstadoTurno
  fecha: string
  horaInicio: string
  onCambiar: (nuevo: EstadoTurno) => Promise<void>
}

/**
 * Botones para avanzar un turno según las mismas reglas que el backend (EstadoTurno.java):
 * PENDIENTE → Confirmar / Cancelar; CONFIRMADO → Vino / No vino (cuando ya empezó) / Cancelar.
 */
export function AccionesEstado({ estado, fecha, horaInicio, onCambiar }: Props) {
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const empezo = yaEmpezo(fecha, horaInicio)

  async function cambiar(nuevo: EstadoTurno) {
    setOcupado(true)
    setError(null)
    try { await onCambiar(nuevo) } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo actualizar.') } finally { setOcupado(false) }
  }

  const boton = (nuevo: EstadoTurno, texto: string, clase = 'btn--secundario') => (
    <button type="button" className={`btn ${clase} btn--chico`} disabled={ocupado} onClick={() => cambiar(nuevo)}>{texto}</button>
  )

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {estado === 'PENDIENTE' && boton('CONFIRMADO', 'Confirmar', 'btn--primario')}
      {estado === 'CONFIRMADO' && empezo && boton('REALIZADO', 'Vino', 'btn--primario')}
      {estado === 'CONFIRMADO' && empezo && boton('AUSENTE', 'No vino')}
      {(estado === 'PENDIENTE' || estado === 'CONFIRMADO') && !empezo && boton('CANCELADO', 'Cancelar', 'btn--peligro')}
      {error && <span role="alert" style={{ color: 'var(--c-error)', fontSize: 'var(--t-xs)', flexBasis: '100%' }}>{error}</span>}
    </div>
  )
}
