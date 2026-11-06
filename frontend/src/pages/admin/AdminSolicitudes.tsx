import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { catalogo, compras } from '../../api/api'
import type { EstadoSolicitud, SolicitudCompra } from '../../api/tipos'
import { useCarga } from '../../hooks/useCarga'
import { precio } from '../../utils/formato'
import { TablaSolicitudes } from '../../components/TablaSolicitudes'
import { Cargando, MensajeError, Vacio } from '../../components/Estados'
import estilos from './Admin.module.css'

const ESTADOS: { valor: EstadoSolicitud; texto: string }[] = [
  { valor: 'NUEVA', texto: 'Nuevas' },
  { valor: 'CONTACTADA', texto: 'Contactadas' },
  { valor: 'RESERVADA', texto: 'Reservadas' },
  { valor: 'VENDIDA', texto: 'Vendidas' },
  { valor: 'DESCARTADA', texto: 'Descartadas' },
]

/** Solicitudes de compra de todas las sucursales: el embudo de venta de la concesionaria. */
export default function AdminSolicitudes() {
  const [params, setParams] = useSearchParams()
  const estado = params.get('estado') as EstadoSolicitud | null
  const sucursalId = params.get('sucursal') ? Number(params.get('sucursal')) : null
  const cambiar = (k: string, v: string | null) => {
    const sig = new URLSearchParams(params)
    if (v) sig.set(k, v)
    else sig.delete(k)
    setParams(sig, { replace: true })
  }

  const sucursales = useCarga(() => catalogo.sucursales(), [])
  const solicitudes = useCarga(() => compras.listar({ sucursalId }), [sucursalId])
  const todas = solicitudes.datos ?? []

  const conteo = useMemo(() => {
    const c: Record<EstadoSolicitud, number> = { NUEVA: 0, CONTACTADA: 0, RESERVADA: 0, VENDIDA: 0, DESCARTADA: 0 }
    for (const s of todas) c[s.estado]++
    return c
  }, [todas])
  const cerradas = conteo.VENDIDA + conteo.DESCARTADA
  const conversion = cerradas > 0 ? Math.round((conteo.VENDIDA / cerradas) * 100) : null
  const montoVendido = todas.filter((s) => s.estado === 'VENDIDA').reduce((total, s) => total + s.precioLista, 0)
  const visibles = estado ? todas.filter((s) => s.estado === estado) : todas

  const actualizar = (nueva: SolicitudCompra) => solicitudes.setDatos(todas.map((s) => (s.id === nueva.id ? nueva : s)))

  return (
    <div className={estilos.seccion}>
      <div className={estilos.barraTitulo}>
        <h1>Solicitudes de compra</h1>
        <label className="campo">
          <span className="visualmente-oculto">Sucursal</span>
          <select value={sucursalId ?? ''} onChange={(e) => cambiar('sucursal', e.target.value || null)}>
            <option value="">Todas las sucursales</option>
            {(sucursales.datos ?? []).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </label>
      </div>

      {solicitudes.datos && (
        <dl className={estilos.indicadores}>
          <div className={conteo.NUEVA > 0 ? estilos.indicadorAlerta : undefined}>
            <dt>Nuevas sin contactar</dt><dd>{conteo.NUEVA}</dd>
          </div>
          <div><dt>En curso (contactadas y reservadas)</dt><dd>{conteo.CONTACTADA + conteo.RESERVADA}</dd></div>
          <div>
            <dt>Ventas cerradas</dt><dd>{conteo.VENDIDA}</dd>
            <span className={estilos.aclaracion}>{precio(montoVendido)} a precio de lista</span>
          </div>
          <div>
            <dt>Conversión</dt><dd>{conversion == null ? '—' : `${conversion}%`}</dd>
            <span className={estilos.aclaracion}>de las solicitudes cerradas, terminaron en venta</span>
          </div>
        </dl>
      )}

      <div className={`${estilos.segmentado} ${estilos.desplazable}`} role="group" aria-label="Filtrar por estado">
        <button type="button" aria-pressed={!estado} onClick={() => cambiar('estado', null)}>Todas ({todas.length})</button>
        {ESTADOS.map((e) => (
          <button key={e.valor} type="button" aria-pressed={estado === e.valor} onClick={() => cambiar('estado', e.valor)}>
            {e.texto} ({conteo[e.valor]})
          </button>
        ))}
      </div>

      {solicitudes.cargando && !solicitudes.datos && <Cargando />}
      {solicitudes.error && <MensajeError mensaje={solicitudes.error} alReintentar={solicitudes.recargar} />}
      {solicitudes.datos && visibles.length === 0 && <Vacio titulo="No hay solicitudes con ese filtro" />}
      {visibles.length > 0 && <TablaSolicitudes solicitudes={visibles} onActualizada={actualizar} mostrarVendedor />}
    </div>
  )
}
