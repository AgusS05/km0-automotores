import { useState, type ReactNode } from 'react'
import type { EstadoTurno } from '../api/tipos'
import { desdeIso, hora } from '../utils/formato'
import { EstadoBadge } from './EstadoBadge'
import estilos from './TarjetaTurno.module.css'

interface Props {
  fecha: string
  horaInicio: string
  estado: EstadoTurno
  titulo: string
  children: ReactNode
  /** Si viene, se muestra el botón para cancelar (con confirmación) */
  onCancelar?: () => Promise<void>
}

export function TarjetaTurno({ fecha, horaInicio, estado, titulo, children, onCancelar }: Props) {
  const [confirmando, setConfirmando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const d = desdeIso(fecha)

  async function cancelar() {
    if (!onCancelar) return
    setCancelando(true)
    setError(null)
    try {
      await onCancelar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cancelar.')
    } finally {
      setCancelando(false)
      setConfirmando(false)
    }
  }

  return (
    <article className={`${estilos.tarjeta} ${estado === 'CANCELADO' ? estilos.apagada : ''}`}>
      <div className={estilos.fecha} aria-hidden="true">
        <span className={estilos.dia}>{d.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')}</span>
        <span className={estilos.numero}>{d.getDate()}</span>
        <span className={estilos.mes}>{d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '')}</span>
        <span className={estilos.hora}>{hora(horaInicio)}</span>
      </div>
      <div className={estilos.cuerpo}>
        <div className={estilos.cabecera}>
          <h3>{titulo}</h3>
          <EstadoBadge estado={estado} />
        </div>
        <p className="visualmente-oculto">{d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} a las {hora(horaInicio)}</p>
        <div className={estilos.detalle}>{children}</div>
        {error && <p className={estilos.error} role="alert">{error}</p>}
        {onCancelar && (
          <div className={estilos.acciones}>
            {confirmando ? (
              <>
                <span>¿Cancelar este turno?</span>
                <button type="button" className="btn btn--peligro btn--chico" disabled={cancelando} onClick={cancelar}>
                  {cancelando ? 'Cancelando…' : 'Sí, cancelar'}
                </button>
                <button type="button" className="btn btn--fantasma" onClick={() => setConfirmando(false)}>No</button>
              </>
            ) : (
              <button type="button" className="btn btn--fantasma" onClick={() => setConfirmando(true)}>Cancelar turno</button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
