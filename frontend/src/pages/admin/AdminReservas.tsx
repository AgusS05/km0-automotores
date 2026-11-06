import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { catalogo, clases, testDrives } from '../../api/api'
import type { ClaseManejo, EstadoTurno, TurnoTestDrive } from '../../api/tipos'
import { useCarga } from '../../hooks/useCarga'
import { desdeIso, fechaCorta, hora, hoyIso, sumarDias } from '../../utils/formato'
import { AccionesEstado } from '../../components/AccionesEstado'
import { EstadoBadge } from '../../components/EstadoBadge'
import { Aviso, Cargando, MensajeError, Vacio } from '../../components/Estados'
import { aCsv, contarPorEstado, coincide, desdeClase, desdeTestDrive, nombreTipo, ordenar, type Reserva } from './reservas'
import estilos from './Admin.module.css'

/** El backend acepta hasta 62 días por consulta. */
const MAX_DIAS = 62
const ESTADOS: { valor: EstadoTurno; texto: string }[] = [
  { valor: 'PENDIENTE', texto: 'Pendientes' },
  { valor: 'CONFIRMADO', texto: 'Confirmados' },
  { valor: 'REALIZADO', texto: 'Realizados' },
  { valor: 'AUSENTE', texto: 'No vinieron' },
  { valor: 'CANCELADO', texto: 'Cancelados' },
]
type Tipo = 'todos' | 'test' | 'clase'

function diasEntre(desde: string, hasta: string): number {
  return Math.round((desdeIso(hasta).getTime() - desdeIso(desde).getTime()) / 86_400_000)
}

/**
 * Todas las reservas (test drives y clases) de un período, con filtros por tipo, sucursal,
 * estado y búsqueda de cliente. Los filtros quedan en la URL para poder compartir o recargar la vista.
 */
export default function AdminReservas() {
  const [params, setParams] = useSearchParams()
  const hoy = hoyIso()
  const desde = params.get('desde') ?? sumarDias(hoy, -7)
  const hasta = params.get('hasta') ?? sumarDias(hoy, 14)
  const tipo = (params.get('tipo') as Tipo | null) ?? 'todos'
  const sucursalId = params.get('sucursal') ? Number(params.get('sucursal')) : null
  const estado = params.get('estado') as EstadoTurno | null
  const busqueda = params.get('q') ?? ''

  const cambiar = (cambios: Record<string, string | null>) => {
    const nuevos = new URLSearchParams(params)
    for (const [k, v] of Object.entries(cambios)) {
      if (v === null || v === '') nuevos.delete(k)
      else nuevos.set(k, v)
    }
    setParams(nuevos, { replace: true })
  }

  const rangoInvalido = hasta < desde
    ? 'La fecha "hasta" no puede ser anterior a "desde".'
    : diasEntre(desde, hasta) > MAX_DIAS ? `Elegí un período de hasta ${MAX_DIAS} días.` : null

  const sucursales = useCarga(() => catalogo.sucursales(), [])
  const datos = useCarga<[TurnoTestDrive[], ClaseManejo[]]>(async () => {
    if (rangoInvalido) return [[], []]
    return Promise.all([
      tipo === 'clase' ? Promise.resolve([]) : testDrives.agenda(desde, hasta, { sucursalId }),
      tipo === 'test' ? Promise.resolve([]) : clases.agenda(desde, hasta, { sucursalId }),
    ])
  }, [desde, hasta, tipo, sucursalId, rangoInvalido])

  const todas = useMemo(() => {
    if (!datos.datos) return []
    const [tds, cls] = datos.datos
    return ordenar([...tds.map(desdeTestDrive), ...cls.map(desdeClase)])
  }, [datos.datos])
  const buscadas = useMemo(() => todas.filter((r) => coincide(r, busqueda)), [todas, busqueda])
  const conteo = useMemo(() => contarPorEstado(buscadas), [buscadas])
  const visibles = estado ? buscadas.filter((r) => r.estado === estado) : buscadas

  /** Cambia el estado y actualiza solo esa fila, sin volver a cargar la tabla. */
  async function cambiarEstado(r: Reserva, nuevo: EstadoTurno) {
    if (!datos.datos) return
    const [tds, cls] = datos.datos
    if (r.tipo === 'TEST_DRIVE') {
      const actualizado = await testDrives.cambiarEstado(r.id, nuevo)
      datos.setDatos([tds.map((t) => (t.id === r.id ? actualizado : t)), cls])
    } else {
      const actualizada = await clases.cambiarEstado(r.id, nuevo)
      datos.setDatos([tds, cls.map((c) => (c.id === r.id ? actualizada : c))])
    }
  }

  function descargarCsv() {
    const url = URL.createObjectURL(new Blob([aCsv(visibles)], { type: 'text/csv;charset=utf-8' }))
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `reservas-${desde}-a-${hasta}.csv`
    enlace.click()
    URL.revokeObjectURL(url)
  }

  const atajo = (d: string, h: string) => cambiar({ desde: d, hasta: h })

  return (
    <div className={estilos.seccion}>
      <div className={estilos.barraTitulo}>
        <h1>Reservas</h1>
        <button type="button" className="btn btn--secundario" onClick={descargarCsv} disabled={visibles.length === 0}>
          Descargar Excel (CSV)
        </button>
      </div>

      <div className={estilos.filtros}>
        <div className={estilos.campos}>
          <label className="campo"><span>Desde</span>
            <input type="date" value={desde} onChange={(e) => e.target.value && cambiar({ desde: e.target.value })} />
          </label>
          <label className="campo"><span>Hasta</span>
            <input type="date" value={hasta} onChange={(e) => e.target.value && cambiar({ hasta: e.target.value })} />
          </label>
          <label className="campo"><span>Tipo</span>
            <select value={tipo} onChange={(e) => cambiar({ tipo: e.target.value === 'todos' ? null : e.target.value })}>
              <option value="todos">Test drives y clases</option>
              <option value="test">Solo test drives</option>
              <option value="clase">Solo clases de manejo</option>
            </select>
          </label>
          <label className="campo"><span>Sucursal</span>
            <select value={sucursalId ?? ''} onChange={(e) => cambiar({ sucursal: e.target.value || null })}>
              <option value="">Todas</option>
              {(sucursales.datos ?? []).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </label>
          <label className={`campo ${estilos.campoAncho}`}><span>Buscar</span>
            <input type="search" value={busqueda} placeholder="Cliente, email, teléfono, modelo o patente"
              onChange={(e) => cambiar({ q: e.target.value || null })} />
          </label>
        </div>
        <div className={estilos.atajos}>
          <span>Atajos:</span>
          <button type="button" className="btn btn--fantasma btn--chico" onClick={() => atajo(hoy, hoy)}>Hoy</button>
          <button type="button" className="btn btn--fantasma btn--chico" onClick={() => atajo(hoy, sumarDias(hoy, 7))}>Próximos 7 días</button>
          <button type="button" className="btn btn--fantasma btn--chico" onClick={() => atajo(sumarDias(hoy, -30), hoy)}>Últimos 30 días</button>
        </div>
      </div>

      {rangoInvalido && <Aviso tipo="error">{rangoInvalido}</Aviso>}

      <div className={`${estilos.segmentado} ${estilos.desplazable}`} role="group" aria-label="Filtrar por estado">
        <button type="button" aria-pressed={!estado} onClick={() => cambiar({ estado: null })}>Todas ({buscadas.length})</button>
        {ESTADOS.map((e) => (
          <button key={e.valor} type="button" aria-pressed={estado === e.valor} onClick={() => cambiar({ estado: e.valor })}>
            {e.texto} ({conteo[e.valor]})
          </button>
        ))}
      </div>

      {datos.cargando && !datos.datos && <Cargando />}
      {datos.error && <MensajeError mensaje={datos.error} alReintentar={datos.recargar} />}
      {datos.datos && !rangoInvalido && visibles.length === 0 && (
        <Vacio titulo="No hay reservas con esos filtros">Probá con otro período o sacá algún filtro.</Vacio>
      )}

      {visibles.length > 0 && (
        <div className="tabla-scroll">
          <table className="tabla">
            <caption className="visualmente-oculto">Reservas del {desde} al {hasta}</caption>
            <thead>
              <tr>
                <th>Cuándo</th><th>Cliente</th><th>Reserva</th><th>Sucursal</th><th>Atiende</th><th>Estado</th>
                <th><span className="visualmente-oculto">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((r) => (
                <tr key={r.clave}>
                  <td className={estilos.cuando}>
                    <strong>{fechaCorta(r.fecha)}</strong>
                    <span className={estilos.sub}>{hora(r.horaInicio)} h</span>
                  </td>
                  <td>
                    <strong>{r.cliente.nombreCompleto}</strong>
                    <span className={estilos.sub}><a href={`mailto:${r.cliente.email}`}>{r.cliente.email}</a></span>
                    {r.cliente.telefono && <span className={estilos.sub}><a href={`tel:${r.cliente.telefono}`}>{r.cliente.telefono}</a></span>}
                  </td>
                  <td>
                    <span className={estilos.etiquetaTipo}>{nombreTipo[r.tipo]}</span>
                    {r.detalle}
                    {r.patente && <span className={estilos.sub}>Unidad {r.patente}</span>}
                    {r.observaciones && <span className={estilos.sub}>“{r.observaciones}”</span>}
                    {r.creadoEn && <span className={estilos.sub}>Reservado el {fechaCorta(r.creadoEn.slice(0, 10))}</span>}
                  </td>
                  <td>{r.sucursalNombre}</td>
                  <td>{r.atiende.nombreCompleto}</td>
                  <td><EstadoBadge estado={r.estado} /></td>
                  <td>
                    <AccionesEstado estado={r.estado} fecha={r.fecha} horaInicio={r.horaInicio}
                      onCambiar={(nuevo) => cambiarEstado(r, nuevo)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
