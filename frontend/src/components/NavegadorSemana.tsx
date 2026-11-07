import { fechaCorta, hoyIso, sumarDias, desdeIso } from '../utils/formato'
import estilos from './NavegadorSemana.module.css'

/** Lunes de la semana de una fecha */
export function lunesDe(iso: string): string {
  const dia = desdeIso(iso).getDay() // 0 = domingo
  return sumarDias(iso, dia === 0 ? -6 : 1 - dia)
}

export function NavegadorSemana({ desde, onCambio }: { desde: string; onCambio: (lunes: string) => void }) {
  const hasta = sumarDias(desde, 5)
  return (
    <div className={estilos.nav}>
      <button type="button" className="btn btn--secundario btn--chico" onClick={() => onCambio(sumarDias(desde, -7))} aria-label="Semana anterior">‹</button>
      <span className={estilos.rango}>Semana del {fechaCorta(desde)} al {fechaCorta(hasta)}</span>
      <button type="button" className="btn btn--secundario btn--chico" onClick={() => onCambio(sumarDias(desde, 7))} aria-label="Semana siguiente">›</button>
      <button type="button" className="btn btn--fantasma" onClick={() => onCambio(lunesDe(hoyIso()))}>Esta semana</button>
    </div>
  )
}
