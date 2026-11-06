import { useState } from 'react'
import type { EstadoSolicitud } from '../api/tipos'

interface Props {
  estado: EstadoSolicitud
  onCambiar: (nuevo: EstadoSolicitud) => Promise<void>
}

/** Botones del embudo de venta, con las mismas transiciones que EstadoSolicitud.java. */
export const SIGUIENTES: Record<EstadoSolicitud, { estado: EstadoSolicitud; texto: string; clase: string }[]> = {
  NUEVA: [
    { estado: 'CONTACTADA', texto: 'Ya lo contacté', clase: 'btn--primario' },
    { estado: 'DESCARTADA', texto: 'Descartar', clase: 'btn--peligro' },
  ],
  CONTACTADA: [
    { estado: 'RESERVADA', texto: 'Reservó la unidad', clase: 'btn--primario' },
    { estado: 'VENDIDA', texto: 'Vendido', clase: 'btn--secundario' },
    { estado: 'DESCARTADA', texto: 'Descartar', clase: 'btn--peligro' },
  ],
  RESERVADA: [
    { estado: 'VENDIDA', texto: 'Vendido', clase: 'btn--primario' },
    { estado: 'DESCARTADA', texto: 'Descartar', clase: 'btn--peligro' },
  ],
  VENDIDA: [],
  DESCARTADA: [],
}

export function AccionesSolicitud({ estado, onCambiar }: Props) {
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function cambiar(nuevo: EstadoSolicitud) {
    setOcupado(true)
    setError(null)
    try { await onCambiar(nuevo) } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo actualizar.') } finally { setOcupado(false) }
  }

  if (SIGUIENTES[estado].length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {SIGUIENTES[estado].map((s) => (
        <button key={s.estado} type="button" className={`btn ${s.clase} btn--chico`} disabled={ocupado} onClick={() => cambiar(s.estado)}>
          {s.texto}
        </button>
      ))}
      {error && <span role="alert" style={{ color: 'var(--c-error)', fontSize: 'var(--t-xs)', flexBasis: '100%' }}>{error}</span>}
    </div>
  )
}
