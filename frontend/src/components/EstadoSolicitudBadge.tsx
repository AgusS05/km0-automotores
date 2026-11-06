import type { EstadoSolicitud } from '../api/tipos'
import { nombreEstadoSolicitud } from '../utils/formato'
import estilos from './EstadoSolicitudBadge.module.css'

export function EstadoSolicitudBadge({ estado }: { estado: EstadoSolicitud }) {
  return <span className={`${estilos.badge} ${estilos[estado.toLowerCase()]}`}>{nombreEstadoSolicitud[estado]}</span>
}
