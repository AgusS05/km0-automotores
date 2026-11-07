import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { catalogo, compras } from '../api/api'
import type { FormaPago } from '../api/tipos'
import { useAuth } from '../auth/AuthContext'
import { useCarga } from '../hooks/useCarga'
import { nombreFormaPago, precio } from '../utils/formato'
import { anticipoMinimo, cuotaMensual, validarFinanciacion } from '../utils/financiacion'
import { FotoAuto } from '../components/FotoAuto'
import { SelectorColor } from '../components/SelectorColor'
import { Aviso, Cargando, MensajeError } from '../components/Estados'
import estilos from './Reserva.module.css'
import propios from './Comprar.module.css'

const FORMAS: { valor: FormaPago; texto: string; detalle: string }[] = [
  { valor: 'CONTADO', texto: 'Contado', detalle: 'Transferencia o efectivo al retirar' },
  { valor: 'FINANCIADO', texto: 'Financiado', detalle: 'Anticipo y cuotas fijas en pesos' },
  { valor: 'PLAN_AHORRO', texto: 'Plan de ahorro', detalle: 'Te asesoramos sobre los planes de la marca' },
]
const PASO_ANTICIPO = 100_000

/** Redondea hacia arriba a múltiplos de 100.000 (para que el anticipo sugerido sea un número "redondo"). */
const redondear = (n: number) => Math.ceil(n / PASO_ANTICIPO) * PASO_ANTICIPO

/**
 * Formulario de interés de compra. No se paga nada: el cliente elige versión, color y forma de pago,
 * ve una simulación de la cuota, y el sistema le asigna un vendedor y genera un presupuesto.
 * Las elecciones quedan en la URL: si hay que iniciar sesión, al volver el formulario sigue completo.
 */
export default function Comprar() {
  const [params, setParams] = useSearchParams()
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const modeloId = params.get('modelo') ? Number(params.get('modelo')) : null
  const formaPago = (params.get('pago') as FormaPago | null) ?? 'CONTADO'
  const [usado, setUsado] = useState(params.get('usado') === '1')
  const [usadoDescripcion, setUsadoDescripcion] = useState(params.get('usadoDesc') ?? '')
  const [comentario, setComentario] = useState(params.get('comentario') ?? '')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const modelos = useCarga(() => catalogo.modelos(), [])
  const modelo = useCarga(() => (modeloId ? catalogo.modelo(modeloId) : Promise.resolve(null)), [modeloId])
  const condiciones = useCarga(() => compras.condiciones(), [])
  const sucursales = useCarga(() => catalogo.sucursales(), [])

  const m = modelo.datos
  const version = m?.versiones.find((v) => v.id === Number(params.get('version'))) ?? m?.versiones[0] ?? null
  const color = m?.colores.find((c) => c.nombre === params.get('color')) ?? null
  const sucursalId = params.get('sucursal') ? Number(params.get('sucursal'))
    : m?.sucursalesConDemo[0]?.id ?? sucursales.datos?.[0]?.id ?? null
  const cond = condiciones.datos
  const anticipo = params.get('anticipo') ? Number(params.get('anticipo')) : null
  const cuotas = params.get('cuotas') ? Number(params.get('cuotas')) : null

  function actualizar(cambios: Record<string, string | null>) {
    setParams((prev) => {
      const sig = new URLSearchParams(prev)
      for (const [k, v] of Object.entries(cambios)) {
        if (v == null || v === '') sig.delete(k)
        else sig.set(k, v)
      }
      return sig
    }, { replace: true })
    setError(null)
  }

  // Al pasar a financiado (o cambiar de versión) se sugiere el anticipo mínimo y 36 cuotas
  useEffect(() => {
    if (formaPago !== 'FINANCIADO' || !version || !cond) return
    const minimo = anticipoMinimo(version.precio, cond.anticipoMinimoPorcentaje)
    const cambios: Record<string, string> = {}
    if (anticipo == null || anticipo < minimo || anticipo >= version.precio) cambios.anticipo = String(Math.min(redondear(minimo), version.precio - PASO_ANTICIPO))
    if (cuotas == null || !cond.cuotas.includes(cuotas)) cambios.cuotas = String(cond.cuotas.includes(36) ? 36 : cond.cuotas[0])
    if (Object.keys(cambios).length) actualizar(cambios)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formaPago, version?.id, cond])

  const modelosAgrupados = useMemo(() => {
    const mapa = new Map<string, { id: number; nombre: string }[]>()
    for (const x of modelos.datos ?? []) mapa.set(x.marcaNombre, [...(mapa.get(x.marcaNombre) ?? []), { id: x.id, nombre: x.nombre }])
    return [...mapa.entries()]
  }, [modelos.datos])

  const problemaFinanciacion = formaPago === 'FINANCIADO' && version && cond
    ? validarFinanciacion(version.precio, anticipo, cuotas, cond.cuotas, cond.anticipoMinimoPorcentaje)
    : null
  const simulacion = formaPago === 'FINANCIADO' && version && cond && anticipo != null && cuotas && !problemaFinanciacion
    ? { monto: version.precio - anticipo, cuota: cuotaMensual(version.precio - anticipo, cuotas, cond.tnaReferencia) }
    : null
  const faltaUsado = usado && !usadoDescripcion.trim()
  const listo = !!version && !!sucursalId && !problemaFinanciacion && !faltaUsado
  const esCliente = usuario?.rol === 'CLIENTE'

  async function enviar() {
    if (!listo || !version || !sucursalId) return
    if (!usuario) {
      // Se guarda todo en la URL de vuelta, así el formulario sigue completo después del login
      const vuelta = new URLSearchParams(params)
      if (usado) { vuelta.set('usado', '1'); vuelta.set('usadoDesc', usadoDescripcion) }
      if (comentario) vuelta.set('comentario', comentario)
      navigate('/ingresar', { state: { desde: `${location.pathname}?${vuelta}`, motivo: 'Ingresá o creá tu cuenta para enviar la solicitud de compra.' } })
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const s = await compras.crear({
        versionId: version.id, color: color?.nombre ?? null, sucursalId, formaPago,
        anticipo: formaPago === 'FINANCIADO' ? anticipo : null, cuotas: formaPago === 'FINANCIADO' ? cuotas : null,
        entregaUsado: usado, usadoDescripcion: usado ? usadoDescripcion.trim() : null, comentario: comentario.trim() || null,
      })
      navigate(`/solicitudes/${s.id}`, { state: { nueva: true } })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos enviar la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <header className={estilos.encabezado}>
        <h1>Quiero comprarlo</h1>
        <p className={estilos.bajada}>
          Contanos qué auto querés y cómo pensás pagarlo. No se cobra nada: un vendedor te contacta para confirmar
          disponibilidad y condiciones, y te queda un presupuesto para imprimir.
        </p>
      </header>

      <div className={estilos.cuerpo}>
        <ol className={estilos.pasos}>
          <li className={estilos.paso}>
            <h2 className={estilos.tituloPaso}>Modelo y versión</h2>
            {modelos.error && <MensajeError mensaje={modelos.error} alReintentar={modelos.recargar} />}
            <label className="campo">
              <span className="visualmente-oculto">Modelo</span>
              <select value={modeloId ?? ''} onChange={(e) => actualizar({ modelo: e.target.value || null, version: null, color: null, anticipo: null })}>
                <option value="">Elegí un modelo</option>
                {modelosAgrupados.map(([marca, lista]) => (
                  <optgroup key={marca} label={marca}>
                    {lista.map((x) => <option key={x.id} value={x.id}>{marca} {x.nombre}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
            {modelo.cargando && modeloId && <Cargando texto="Cargando versiones" />}
            {m && (
              <div className={propios.opciones} role="radiogroup" aria-label="Versión">
                {m.versiones.map((v) => (
                  <button key={v.id} type="button" role="radio" aria-checked={version?.id === v.id} className={estilos.sucursal}
                    onClick={() => actualizar({ version: String(v.id), anticipo: null })}>
                    <strong>{v.nombreVersion}</strong>
                    <span>{[v.motor, v.transmision].filter(Boolean).join(' · ')}</span>
                    <span className={propios.precioOpcion}>{precio(v.precio)}</span>
                  </button>
                ))}
              </div>
            )}
          </li>

          <li className={`${estilos.paso} ${!m ? estilos.inactivo : ''}`}>
            <h2 className={estilos.tituloPaso}>Color</h2>
            {m && m.colores.length > 0 ? (
              <>
                <SelectorColor colores={m.colores} valor={color?.hex ?? ''}
                  onCambio={(hex) => actualizar({ color: m.colores.find((c) => c.hex === hex)?.nombre ?? null })} />
                {!color && <p className={estilos.ayuda}>Opcional: si todavía no lo decidiste, lo charlás con el vendedor.</p>}
              </>
            ) : <p className={estilos.ayuda}>{m ? 'Este modelo no tiene colores cargados.' : 'Primero elegí el modelo.'}</p>}
          </li>

          <li className={`${estilos.paso} ${!m ? estilos.inactivo : ''}`}>
            <h2 className={estilos.tituloPaso}>Forma de pago</h2>
            <div className={propios.opciones} role="radiogroup" aria-label="Forma de pago">
              {FORMAS.map((f) => (
                <button key={f.valor} type="button" role="radio" aria-checked={formaPago === f.valor} className={estilos.sucursal}
                  onClick={() => actualizar({ pago: f.valor === 'CONTADO' ? null : f.valor })}>
                  <strong>{f.texto}</strong>
                  <span>{f.detalle}</span>
                </button>
              ))}
            </div>

            {formaPago === 'FINANCIADO' && version && cond && (
              <div className={propios.financiacion}>
                <label className="campo">
                  <span>Anticipo</span>
                  <input type="range" min={redondear(anticipoMinimo(version.precio, cond.anticipoMinimoPorcentaje))} max={version.precio - PASO_ANTICIPO}
                    step={PASO_ANTICIPO} value={anticipo ?? 0} onChange={(e) => actualizar({ anticipo: e.target.value })}
                    aria-valuetext={precio(anticipo)} />
                  <span className={propios.valorAnticipo}>
                    {precio(anticipo)} <small>({anticipo != null ? Math.round((anticipo / version.precio) * 100) : 0} % del precio)</small>
                  </span>
                  <span className="campo__ayuda">Mínimo {cond.anticipoMinimoPorcentaje} %: {precio(anticipoMinimo(version.precio, cond.anticipoMinimoPorcentaje))}</span>
                </label>
                <label className="campo">
                  <span>Cuotas</span>
                  <select value={cuotas ?? ''} onChange={(e) => actualizar({ cuotas: e.target.value })}>
                    {cond.cuotas.map((c) => <option key={c} value={c}>{c} cuotas</option>)}
                  </select>
                </label>
              </div>
            )}
            {formaPago === 'PLAN_AHORRO' && (
              <p className={estilos.ayuda}>Las cuotas del plan dependen de la marca y del plan vigente: el vendedor te pasa las opciones.</p>
            )}

            <label className={propios.check}>
              <input type="checkbox" checked={usado} onChange={(e) => setUsado(e.target.checked)} />
              Entrego mi auto usado como parte de pago
            </label>
            {usado && (
              <label className={`campo ${faltaUsado ? 'campo--error' : ''}`}>
                <span>¿Qué auto entregás?</span>
                <input value={usadoDescripcion} maxLength={200} onChange={(e) => setUsadoDescripcion(e.target.value)}
                  placeholder="Marca, modelo, año y kilómetros. Ej: Chevrolet Onix LT 2019, 62.000 km" />
                <span className="campo__ayuda">Lo cotiza el vendedor cuando lo ve.</span>
              </label>
            )}
          </li>

          <li className={`${estilos.paso} ${!m ? estilos.inactivo : ''}`}>
            <h2 className={estilos.tituloPaso}>Sucursal</h2>
            <p className={estilos.ayuda}>Dónde querés que te atiendan y retirar el auto.</p>
            <div className={estilos.opcionesSucursal} role="radiogroup" aria-label="Sucursal">
              {(sucursales.datos ?? []).map((s) => (
                <button key={s.id} type="button" role="radio" aria-checked={sucursalId === s.id} className={estilos.sucursal}
                  onClick={() => actualizar({ sucursal: String(s.id) })}>
                  <strong>{s.nombre}</strong>
                  <span>{s.direccion}, {s.ciudad}</span>
                </button>
              ))}
            </div>
          </li>
        </ol>

        <aside className={estilos.resumen} aria-label="Tu presupuesto">
          <h2 className={estilos.tituloResumen}>Tu presupuesto</h2>
          {m ? (
            <FotoAuto url={m.imagenes[0]?.url} alt={`${m.marcaNombre} ${m.nombre}`} tipo={m.tipoCarroceria} className={estilos.fotoResumen} />
          ) : <div className={estilos.fotoVacia} />}
          <dl className={estilos.datos}>
            <div><dt>Auto</dt><dd>{m && version ? `${m.marcaNombre} ${m.nombre} ${version.nombreVersion}` : '—'}</dd></div>
            <div><dt>Color</dt><dd>{color ? <><span className={propios.muestra} style={{ backgroundColor: color.hex }} />{color.nombre}</> : 'A definir'}</dd></div>
            <div><dt>Precio de lista</dt><dd>{version ? precio(version.precio) : '—'}</dd></div>
            <div><dt>Forma de pago</dt><dd>{nombreFormaPago[formaPago]}</dd></div>
            {simulacion && cuotas && anticipo != null && (
              <>
                <div><dt>Anticipo</dt><dd>{precio(anticipo)}</dd></div>
                <div><dt>A financiar</dt><dd>{precio(simulacion.monto)}</dd></div>
                <div className={propios.destacado}><dt>{cuotas} cuotas de</dt><dd>{precio(simulacion.cuota)}</dd></div>
              </>
            )}
            {usado && <div><dt>Usado</dt><dd>Se cotiza en la concesionaria</dd></div>}
          </dl>
          {simulacion && cond && (
            <p className={estilos.ayuda}>
              Cuota estimada con sistema francés y una tasa de referencia de {cond.tnaReferencia} % anual. Sujeta a aprobación del crédito.
            </p>
          )}
          {problemaFinanciacion && <p className={estilos.ayuda}>{problemaFinanciacion}</p>}

          <label className="campo">
            <span>Algo que quieras contarnos (opcional)</span>
            <textarea value={comentario} maxLength={500} onChange={(e) => setComentario(e.target.value)}
              placeholder="Ej: necesito el auto antes de fin de mes" />
          </label>

          {error && (
            <Aviso tipo="error">
              {error} {error.includes('abierta') && <Link to="/mis-turnos">Ver mis solicitudes</Link>}
            </Aviso>
          )}

          <button type="button" className="btn btn--primario" disabled={!listo || enviando || (!!usuario && !esCliente)} onClick={enviar}>
            {enviando ? 'Enviando…' : usuario ? 'Enviar solicitud' : 'Ingresar para enviar'}
          </button>
          {usuario && !esCliente && (
            <p className={estilos.ayuda}>Estás con una cuenta de empleado: las solicitudes se hacen con una cuenta de cliente.</p>
          )}
          <p className={estilos.ayuda}>No se cobra nada por internet. Un vendedor te contacta para confirmar la unidad y las condiciones.</p>
        </aside>
      </div>
    </div>
  )
}
