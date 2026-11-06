import { fechaCorta, hoyIso, sumarDias, desdeIso } from '../utils/formato'
import estilos from './SelectorDia.module.css'

interface Props {
  valor: string | null
  onCambio: (fecha: string) => void
  /** Devuelve false para los días en que no se atiende (se muestran deshabilitados) */
  atiende: (fecha: string) => boolean
  dias?: number
}

/** Tira horizontal con los próximos días. */
export function SelectorDia({ valor, onCambio, atiende, dias = 21 }: Props) {
  const hoy = hoyIso()
  const fechas = Array.from({ length: dias }, (_, i) => sumarDias(hoy, i))
  return (
    <div className={estilos.tira} role="radiogroup" aria-label="Día">
      {fechas.map((f) => {
        const abierto = atiende(f)
        const [dia, numero] = fechaCorta(f).split(' ')
        const esHoy = f === hoy
        return (
          <button
            key={f}
            type="button"
            role="radio"
            aria-checked={valor === f}
            disabled={!abierto}
            className={estilos.dia}
            onClick={() => onCambio(f)}
            aria-label={`${desdeIso(f).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}${abierto ? '' : ', cerrado'}`}
          >
            <span className={estilos.nombre}>{esHoy ? 'Hoy' : dia}</span>
            <span className={estilos.numero}>{numero}</span>
          </button>
        )
      })}
    </div>
  )
}
