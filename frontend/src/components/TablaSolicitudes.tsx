import { Link } from 'react-router'
import { compras } from '../api/api'
import type { SolicitudCompra } from '../api/tipos'
import { fechaCorta, nombreFormaPago, precio } from '../utils/formato'
import { EstadoSolicitudBadge } from './EstadoSolicitudBadge'
import { AccionesSolicitud } from './AccionesSolicitud'

interface Props {
  solicitudes: SolicitudCompra[]
  /** Se llama con la solicitud actualizada después de cambiarle el estado */
  onActualizada: (s: SolicitudCompra) => void
  /** El admin ve también quién la atiende */
  mostrarVendedor?: boolean
}

/** Detalle corto de cómo paga: "Contado", "Financiado: 36 × $ 1.422.998", "Plan de ahorro". */
export function resumenPago(s: SolicitudCompra): string {
  if (s.formaPago === 'FINANCIADO' && s.cuotas && s.cuotaEstimada) return `Financiado: ${s.cuotas} × ${precio(s.cuotaEstimada)}`
  return nombreFormaPago[s.formaPago]
}

/** Tabla de solicitudes de compra para el vendedor y el administrador. */
export function TablaSolicitudes({ solicitudes, onActualizada, mostrarVendedor = false }: Props) {
  return (
    <div className="tabla-scroll">
      <table className="tabla">
        <thead>
          <tr>
            <th>Pedida</th><th>Cliente</th><th>Auto</th><th>Pago</th>
            {mostrarVendedor && <th>Atiende</th>}
            <th>Estado</th><th><span className="visualmente-oculto">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          {solicitudes.map((s) => (
            <tr key={s.id}>
              <td style={{ whiteSpace: 'nowrap' }}>
                <strong>{fechaCorta(s.creadoEn.slice(0, 10))}</strong>
                <span style={{ display: 'block', fontSize: 'var(--t-xs)', color: 'var(--c-texto-2)' }}>N° {s.id}</span>
              </td>
              <td>
                <strong>{s.cliente.nombreCompleto}</strong>
                <span style={{ display: 'block', fontSize: 'var(--t-xs)' }}><a href={`mailto:${s.cliente.email}`}>{s.cliente.email}</a></span>
                {s.cliente.telefono && <span style={{ display: 'block', fontSize: 'var(--t-xs)' }}><a href={`tel:${s.cliente.telefono}`}>{s.cliente.telefono}</a></span>}
              </td>
              <td>
                {s.marcaNombre} {s.modeloNombre} {s.versionNombre}
                <span style={{ display: 'block', fontSize: 'var(--t-xs)', color: 'var(--c-texto-2)' }}>
                  {s.color ?? 'Color a definir'}{s.entregaUsado ? ' · Entrega usado' : ''}
                </span>
              </td>
              <td>
                {resumenPago(s)}
                <span style={{ display: 'block', fontSize: 'var(--t-xs)', color: 'var(--c-texto-2)' }}>Lista {precio(s.precioLista)}</span>
              </td>
              {mostrarVendedor && (
                <td>
                  {s.vendedor.nombreCompleto}
                  <span style={{ display: 'block', fontSize: 'var(--t-xs)', color: 'var(--c-texto-2)' }}>{s.sucursalNombre}</span>
                </td>
              )}
              <td><EstadoSolicitudBadge estado={s.estado} /></td>
              <td>
                <div style={{ display: 'grid', gap: 6, justifyItems: 'start' }}>
                  <AccionesSolicitud estado={s.estado} onCambiar={async (nuevo) => onActualizada(await compras.cambiarEstado(s.id, nuevo))} />
                  <Link to={`/solicitudes/${s.id}`} style={{ fontSize: 'var(--t-sm)' }}>Ver presupuesto</Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
