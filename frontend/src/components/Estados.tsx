import type { ReactNode } from 'react'
import estilos from './Estados.module.css'

export function Cargando({ texto = 'Cargando' }: { texto?: string }) {
  return (
    <div className={estilos.cargando} role="status" aria-live="polite">
      <span className={estilos.ruta} aria-hidden="true" />
      <span>{texto}…</span>
    </div>
  )
}

export function MensajeError({ mensaje, alReintentar }: { mensaje: string; alReintentar?: () => void }) {
  return (
    <div className={estilos.error} role="alert">
      <p>{mensaje}</p>
      {alReintentar && <button type="button" className="btn btn--secundario btn--chico" onClick={alReintentar}>Reintentar</button>}
    </div>
  )
}

export function Vacio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className={estilos.vacio}>
      <h3>{titulo}</h3>
      {children}
    </div>
  )
}

export function Aviso({ tipo = 'info', children }: { tipo?: 'info' | 'ok' | 'error'; children: ReactNode }) {
  const clase = { info: estilos.avisoInfo, ok: estilos.avisoOk, error: estilos.avisoError }[tipo]
  return <div className={`${estilos.aviso} ${clase}`} role={tipo === 'error' ? 'alert' : 'status'}>{children}</div>
}
