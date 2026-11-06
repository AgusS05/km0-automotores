import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { catalogo } from '../api/api'
import type { Combustible, TipoCarroceria } from '../api/tipos'
import { useCarga } from '../hooks/useCarga'
import { nombreCarroceria, nombreCombustible } from '../utils/formato'
import { TarjetaModelo } from '../components/TarjetaModelo'
import { Cargando, MensajeError, Vacio } from '../components/Estados'
import estilos from './Catalogo.module.css'

const CARROCERIAS: TipoCarroceria[] = ['SEDAN', 'HATCHBACK', 'SUV', 'PICKUP']
const COMBUSTIBLES: Combustible[] = ['NAFTA', 'DIESEL', 'HIBRIDO']
const TOPES = [30_000_000, 45_000_000, 60_000_000, 80_000_000]

export default function Catalogo() {
  const [params, setParams] = useSearchParams()
  const marcaId = params.get('marca') ? Number(params.get('marca')) : null
  const carroceria = (params.get('carroceria') as TipoCarroceria | null) ?? null
  const combustible = (params.get('combustible') as Combustible | null) ?? null
  const precioMax = params.get('hasta') ? Number(params.get('hasta')) : null
  const q = params.get('q') ?? ''

  // La búsqueda por texto espera a que el usuario deje de escribir
  const [texto, setTexto] = useState(q)
  useEffect(() => {
    const t = window.setTimeout(() => cambiar('q', texto.trim() || null), 250)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto])

  const marcas = useCarga(() => catalogo.marcas(), [])
  const modelos = useCarga(
    () => catalogo.modelos({ marcaId, carroceria, combustible, precioMax, q }),
    [marcaId, carroceria, combustible, precioMax, q],
  )

  function cambiar(clave: string, valor: string | null) {
    setParams((prev) => {
      const sig = new URLSearchParams(prev)
      if (valor == null || valor === '') sig.delete(clave)
      else sig.set(clave, valor)
      return sig
    }, { replace: true })
  }

  const hayFiltros = marcaId != null || carroceria != null || combustible != null || precioMax != null || q !== ''
  const limpiar = () => { setTexto(''); setParams({}, { replace: true }) }

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <header className={estilos.encabezado}>
        <h1>Modelos 0 km</h1>
        <p className={estilos.bajada}>Todos se pueden probar en alguna de nuestras sucursales.</p>
      </header>

      <div className={estilos.cuerpo}>
        <aside className={estilos.filtros} aria-label="Filtros">
          <label className="campo">
            <span>Buscar</span>
            <input type="search" value={texto} placeholder="Ej: Hilux, Corolla" onChange={(e) => setTexto(e.target.value)} />
          </label>

          <fieldset className={estilos.grupo}>
            <legend>Marca</legend>
            <div className={estilos.opciones}>
              <button type="button" aria-pressed={marcaId == null} className={estilos.opcion} onClick={() => cambiar('marca', null)}>Todas</button>
              {(marcas.datos ?? []).map((m) => (
                <button key={m.id} type="button" aria-pressed={marcaId === m.id} className={estilos.opcion}
                  onClick={() => cambiar('marca', marcaId === m.id ? null : String(m.id))}>
                  {m.nombre}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={estilos.grupo}>
            <legend>Carrocería</legend>
            <div className={estilos.opciones}>
              {CARROCERIAS.map((c) => (
                <button key={c} type="button" aria-pressed={carroceria === c} className={estilos.opcion}
                  onClick={() => cambiar('carroceria', carroceria === c ? null : c)}>
                  {nombreCarroceria[c]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="campo">
            <span>Combustible</span>
            <select value={combustible ?? ''} onChange={(e) => cambiar('combustible', e.target.value || null)}>
              <option value="">Cualquiera</option>
              {COMBUSTIBLES.map((c) => <option key={c} value={c}>{nombreCombustible[c]}</option>)}
            </select>
          </label>

          <label className="campo">
            <span>Precio hasta</span>
            <select value={precioMax ?? ''} onChange={(e) => cambiar('hasta', e.target.value || null)}>
              <option value="">Sin límite</option>
              {TOPES.map((t) => <option key={t} value={t}>{`$${(t / 1_000_000).toLocaleString('es-AR')} millones`}</option>)}
            </select>
          </label>

          {hayFiltros && <button type="button" className="btn btn--fantasma" onClick={limpiar}>Quitar filtros</button>}
        </aside>

        <section className={estilos.resultados} aria-live="polite" aria-busy={modelos.cargando}>
          {modelos.error && <MensajeError mensaje={modelos.error} alReintentar={modelos.recargar} />}
          {modelos.cargando && !modelos.datos && <Cargando texto="Buscando modelos" />}
          {modelos.datos && (
            <>
              <p className={estilos.cantidad}>
                {modelos.datos.length === 1 ? '1 modelo' : `${modelos.datos.length} modelos`}
              </p>
              {modelos.datos.length === 0 ? (
                <Vacio titulo="Ningún modelo coincide con esos filtros">
                  <p>Probá con otra carrocería o subí el tope de precio.</p>
                  <button type="button" className="btn btn--secundario btn--chico" onClick={limpiar}>Quitar filtros</button>
                </Vacio>
              ) : (
                <div className={estilos.grilla}>
                  {modelos.datos.map((m) => <TarjetaModelo key={m.id} modelo={m} />)}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
