import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { catalogo } from '../api/api'
import type { Version } from '../api/tipos'
import { useCarga } from '../hooks/useCarga'
import { nombreCombustible, precio } from '../utils/formato'
import { FotoAuto } from '../components/FotoAuto'
import { Cargando, MensajeError } from '../components/Estados'
import estilos from './Comparador.module.css'

const MAX = 3

interface Fila {
  etiqueta: string
  valor: (v: Version) => string
  /** Para resaltar el mejor valor de la fila (ej. menor precio) */
  mejor?: (vs: Version[]) => number | null
}

const FILAS: Fila[] = [
  { etiqueta: 'Precio', valor: (v) => precio(v.precio), mejor: (vs) => Math.min(...vs.map((v) => v.precio)) },
  { etiqueta: 'Motor', valor: (v) => v.motor ?? '—' },
  { etiqueta: 'Potencia', valor: (v) => (v.potenciaCv ? `${v.potenciaCv} CV` : '—'), mejor: (vs) => Math.max(...vs.map((v) => v.potenciaCv ?? 0)) },
  { etiqueta: 'Caja', valor: (v) => v.transmision ?? '—' },
  { etiqueta: 'Combustible', valor: (v) => nombreCombustible[v.combustible] },
  { etiqueta: 'Tracción', valor: (v) => v.traccion ?? '—' },
  { etiqueta: 'Puertas', valor: (v) => (v.puertas ? String(v.puertas) : '—') },
  { etiqueta: 'Plazas', valor: (v) => (v.plazas ? String(v.plazas) : '—') },
]

export default function Comparador() {
  const [params, setParams] = useSearchParams()
  const ids = useMemo(
    () => (params.get('versiones') ?? '').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, MAX),
    [params],
  )
  const todas = useCarga(() => catalogo.versiones(), [])

  const elegidas = useMemo(
    () => ids.map((id) => todas.datos?.find((v) => v.id === id)).filter((v): v is Version => !!v),
    [ids, todas.datos],
  )

  // Opciones agrupadas por "Marca Modelo" para los selectores
  const grupos = useMemo(() => {
    const mapa = new Map<string, Version[]>()
    for (const v of todas.datos ?? []) {
      const clave = `${v.marcaNombre} ${v.modeloNombre}`
      mapa.set(clave, [...(mapa.get(clave) ?? []), v])
    }
    return [...mapa.entries()]
  }, [todas.datos])

  function elegir(posicion: number, id: number | null) {
    const nuevos = [...ids]
    if (id == null) nuevos.splice(posicion, 1)
    else nuevos[posicion] = id
    const unicos = [...new Set(nuevos)].slice(0, MAX)
    setParams(unicos.length ? { versiones: unicos.join(',') } : {}, { replace: true })
  }

  const columnas = Math.min(elegidas.length + 1, MAX)
  const posiciones = Array.from({ length: columnas }, (_, i) => i)

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <header className={estilos.encabezado}>
        <h1>Comparar versiones</h1>
        <p className={estilos.bajada}>Elegí hasta tres versiones, de la misma marca o de distintas, y miralas lado a lado.</p>
      </header>

      {todas.error && <MensajeError mensaje={todas.error} alReintentar={todas.recargar} />}
      {todas.cargando && <Cargando />}

      {todas.datos && (
        <div className="tabla-scroll">
          <table className={`tabla ${estilos.tabla}`}>
            <thead>
              <tr>
                <td className={estilos.esquina}><span className="visualmente-oculto">Característica</span></td>
                {posiciones.map((i) => {
                  const v = elegidas[i]
                  return (
                    <th key={i} scope="col" className={estilos.columna}>
                      <label className="campo">
                        <span className="visualmente-oculto">Versión {i + 1}</span>
                        <select value={v?.id ?? ''} onChange={(e) => elegir(i, e.target.value ? Number(e.target.value) : null)}>
                          <option value="">{v ? 'Quitar' : 'Agregar una versión'}</option>
                          {grupos.map(([nombre, versiones]) => (
                            <optgroup key={nombre} label={nombre}>
                              {versiones.map((ver) => (
                                <option key={ver.id} value={ver.id} disabled={ids.includes(ver.id) && ver.id !== v?.id}>
                                  {ver.nombreVersion}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </label>
                      {v && (
                        <div className={estilos.cabecera}>
                          <FotoAuto url={v.imagenUrl} alt={`${v.marcaNombre} ${v.modeloNombre}`} tipo={v.tipoCarroceria} />
                          <p className={estilos.modelo}>{v.marcaNombre} {v.modeloNombre}</p>
                          <p className={estilos.version}>{v.nombreVersion}</p>
                          <Link to={`/modelos/${v.modeloId}`}>Ver ficha</Link>
                        </div>
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            {elegidas.length > 0 && (
              <tbody>
                {FILAS.map((f) => {
                  const mejor = elegidas.length > 1 && f.mejor ? f.mejor(elegidas) : null
                  return (
                    <tr key={f.etiqueta}>
                      <th scope="row" className={estilos.etiqueta}>{f.etiqueta}</th>
                      {posiciones.map((i) => {
                        const v = elegidas[i]
                        if (!v) return <td key={i}><span className="visualmente-oculto">Sin versión elegida</span></td>
                        const esMejor = mejor != null && (f.etiqueta === 'Precio' ? v.precio === mejor : v.potenciaCv === mejor)
                        return (
                          <td key={i} className={esMejor ? estilos.mejor : undefined}>
                            {f.valor(v)}
                            {esMejor && <span className={estilos.marcaMejor}>{f.etiqueta === 'Precio' ? 'Más económica' : 'Más potente'}</span>}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
                <tr>
                  <th scope="row" className={estilos.etiqueta}><span className="visualmente-oculto">Reservar</span></th>
                  {posiciones.map((i) => {
                    const v = elegidas[i]
                    return (
                      <td key={i}>
                        {v && <Link to={`/test-drive?modelo=${v.modeloId}`} className="btn btn--primario btn--chico">Probar este</Link>}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            )}
          </table>
        </div>
      )}
    </div>
  )
}
