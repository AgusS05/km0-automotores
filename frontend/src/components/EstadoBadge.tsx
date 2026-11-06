import type { EstadoTurno } from '../api/tipos'
import { nombreEstado } from '../utils/formato'
import estilos from './EstadoBadge.module.css'

export function EstadoBadge({ estado }: { estado: EstadoTurno }) {
  return <span className={`${estilos.badge} ${estilos[estado.toLowerCase()]}`}>{nombreEstado[estado]}</span>
}
