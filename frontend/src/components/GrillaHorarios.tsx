import type { Disponibilidad } from '../api/tipos'
import { hora } from '../utils/formato'
import estilos from './GrillaHorarios.module.css'

interface Props {
  disponibilidad: Disponibilidad
  valor: string | null
  onCambio: (hora: string) => void
}

/** Horarios del día: los libres se pueden elegir; los ocupados se ven, pero deshabilitados. */
export function GrillaHorarios({ disponibilidad, valor, onCambio }: Props) {
  if (disponibilidad.motivo) {
    return <p className={estilos.motivo}>{disponibilidad.motivo}</p>
  }
  const libres = disponibilidad.horarios.filter((h) => h.disponible).length
  return (
    <div>
      <p className={estilos.resumen}>
        {libres === 0 ? 'No quedan horarios libres ese día. Probá con otro día.' : `${libres} ${libres === 1 ? 'horario libre' : 'horarios libres'}`}
      </p>
      <div className={estilos.grilla} role="radiogroup" aria-label="Horario">
        {disponibilidad.horarios.map((h) => (
          <button
            key={h.hora}
            type="button"
            role="radio"
            aria-checked={valor === h.hora}
            disabled={!h.disponible}
            className={estilos.horario}
            onClick={() => onCambio(h.hora)}
          >
            <span className={estilos.hora}>{hora(h.hora)}</span>
            <span className={estilos.estado}>
              {!h.disponible ? 'No disponible' : h.lugares === 1 ? 'Último lugar' : 'Libre'}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
