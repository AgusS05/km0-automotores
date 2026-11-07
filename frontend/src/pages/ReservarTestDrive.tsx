import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { catalogo, testDrives } from '../api/api'
import type { Disponibilidad, TurnoTestDrive } from '../api/tipos'
import { useAuth } from '../auth/AuthContext'
import { useCarga } from '../hooks/useCarga'
import { atiendeEseDia, fechaLarga, hora, precio, sumarMinutos } from '../utils/formato'
import { SelectorDia } from '../components/SelectorDia'
import { GrillaHorarios } from '../components/GrillaHorarios'
import { FotoAuto } from '../components/FotoAuto'
import { Aviso, Cargando, MensajeError } from '../components/Estados'
import estilos from './Reserva.module.css'

export default function ReservarTestDrive() {
  const [params, setParams] = useSearchParams()
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const modeloId = params.get('modelo') ? Number(params.get('modelo')) : null
  const sucursalId = params.get('sucursal') ? Number(params.get('sucursal')) : null
  const fecha = params.get('fecha')
  const horaElegida = params.get('hora')

  const [observaciones, setObservaciones] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errorReserva, setErrorReserva] = useState<string | null>(null)
  const [confirmado, setConfirmado] = useState<TurnoTestDrive | null>(null)

  const modelos = useCarga(() => catalogo.modelos(), [])
  const modelo = useCarga(() => (modeloId ? catalogo.modelo(modeloId) : Promise.resolve(null)), [modeloId])
  const sucursal = modelo.datos?.sucursalesConDemo.find((s) => s.id === sucursalId) ?? null

  const [disp, setDisp] = useState<Disponibilidad | null>(null)
  const [cargandoDisp, setCargandoDisp] = useState(false)
  const [errorDisp, setErrorDisp] = useState<string | null>(null)

  function actualizar(cambios: Record<string, string | null>) {
    setParams((prev) => {
      const sig = new URLSearchParams(prev)
      for (const [k, v] of Object.entries(cambios)) {
        if (v == null) sig.delete(k)
        else sig.set(k, v)
      }
      return sig
    }, { replace: true })
    setErrorReserva(null)
  }

  // Si el modelo tiene una sola sucursal con demo, se elige sola
  useEffect(() => {
    const sucs = modelo.datos?.sucursalesConDemo
    if (sucs && sucs.length === 1 && sucursalId !== sucs[0].id) actualizar({ sucursal: String(sucs[0].id), fecha: null, hora: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelo.datos])

  // Horarios del día elegido
  const cargarDisponibilidad = useMemo(() => () => {
    if (!modeloId || !sucursalId || !fecha) { setDisp(null); return }
    setCargandoDisp(true)
    setErrorDisp(null)
    testDrives.disponibilidad(modeloId, sucursalId, fecha)
      .then(setDisp)
      .catch((e: Error) => setErrorDisp(e.message))
      .finally(() => setCargandoDisp(false))
  }, [modeloId, sucursalId, fecha])
  useEffect(() => { cargarDisponibilidad() }, [cargarDisponibilidad])

  const modelosAgrupados = useMemo(() => {
    const mapa = new Map<string, { id: number; nombre: string }[]>()
    for (const m of modelos.datos ?? []) mapa.set(m.marcaNombre, [...(mapa.get(m.marcaNombre) ?? []), { id: m.id, nombre: m.nombre }])
    return [...mapa.entries()]
  }, [modelos.datos])

  const listo = modeloId && sucursalId && fecha && horaElegida

  async function confirmar() {
    if (!listo) return
    if (!usuario) {
      navigate('/ingresar', { state: { desde: location.pathname + location.search, motivo: 'Ingresá o creá tu cuenta para confirmar el test drive.' } })
      return
    }
    setEnviando(true)
    setErrorReserva(null)
    try {
      const turno = await testDrives.reservar({ modeloId, sucursalId, fecha, horaInicio: horaElegida, observaciones: observaciones || undefined })
      setConfirmado(turno)
      window.scrollTo({ top: 0 })
    } catch (e) {
      setErrorReserva(e instanceof Error ? e.message : 'No pudimos reservar el turno.')
      cargarDisponibilidad() // el horario pudo haberse ocupado: se refresca la grilla
    } finally {
      setEnviando(false)
    }
  }

  if (confirmado) {
    return (
      <div className={`contenedor ${estilos.pagina}`}>
        <section className={estilos.confirmacion} aria-live="polite">
          <p className={estilos.check} aria-hidden="true">✓</p>
          <h1>Tu test drive quedó reservado</h1>
          <p className={estilos.detalleConfirmacion}>
            <strong>{confirmado.marcaNombre} {confirmado.modeloNombre}</strong> ({confirmado.versionNombre}),{' '}
            {fechaLarga(confirmado.fecha)} a las {hora(confirmado.horaInicio)} en {confirmado.sucursalNombre}, {confirmado.sucursalDireccion}.
          </p>
          <p>Te atiende {confirmado.vendedor.nombreCompleto}. Te va a contactar para confirmar el turno, y el día anterior te llega un recordatorio por email.</p>
          <p>Acordate de llevar tu licencia de conducir vigente.</p>
          <div className={estilos.accionesConfirmacion}>
            <Link to="/mis-turnos" className="btn btn--primario">Ver mis turnos</Link>
            <Link to="/modelos" className="btn btn--secundario">Seguir viendo modelos</Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <header className={estilos.encabezado}>
        <h1>Reservar test drive</h1>
        <p className={estilos.bajada}>Turnos de una hora. Ves solo los horarios con auto y vendedor libres.</p>
      </header>

      <div className={estilos.cuerpo}>
        <ol className={estilos.pasos}>
          <li className={estilos.paso}>
            <h2 className={estilos.tituloPaso}>Modelo</h2>
            {modelos.error && <MensajeError mensaje={modelos.error} alReintentar={modelos.recargar} />}
            <label className="campo">
              <span className="visualmente-oculto">Modelo</span>
              <select value={modeloId ?? ''} onChange={(e) => actualizar({ modelo: e.target.value || null, sucursal: null, fecha: null, hora: null })}>
                <option value="">Elegí un modelo</option>
                {modelosAgrupados.map(([marca, lista]) => (
                  <optgroup key={marca} label={marca}>
                    {lista.map((m) => <option key={m.id} value={m.id}>{marca} {m.nombre}</option>)}
                  </optgroup>
                ))}
              </select>
            </label>
          </li>

          <li className={`${estilos.paso} ${!modeloId ? estilos.inactivo : ''}`}>
            <h2 className={estilos.tituloPaso}>Sucursal</h2>
            {modelo.cargando && modeloId && <Cargando texto="Buscando sucursales" />}
            {modelo.datos && modelo.datos.sucursalesConDemo.length === 0 && (
              <p className={estilos.ayuda}>Este modelo no tiene unidades para test drive en este momento.</p>
            )}
            {modelo.datos && (
              <div className={estilos.opcionesSucursal} role="radiogroup" aria-label="Sucursal">
                {modelo.datos.sucursalesConDemo.map((s) => (
                  <button key={s.id} type="button" role="radio" aria-checked={sucursalId === s.id} className={estilos.sucursal}
                    onClick={() => actualizar({ sucursal: String(s.id), hora: null })}>
                    <strong>{s.nombre}</strong>
                    <span>{s.direccion}, {s.ciudad}</span>
                  </button>
                ))}
              </div>
            )}
            {!modeloId && <p className={estilos.ayuda}>Primero elegí el modelo.</p>}
          </li>

          <li className={`${estilos.paso} ${!sucursal ? estilos.inactivo : ''}`}>
            <h2 className={estilos.tituloPaso}>Día</h2>
            {sucursal ? (
              <SelectorDia valor={fecha} atiende={(f) => atiendeEseDia(sucursal, f)} onCambio={(f) => actualizar({ fecha: f, hora: null })} />
            ) : <p className={estilos.ayuda}>Elegí la sucursal para ver los días.</p>}
          </li>

          <li className={`${estilos.paso} ${!fecha || !sucursal ? estilos.inactivo : ''}`}>
            <h2 className={estilos.tituloPaso}>Horario</h2>
            {!fecha || !sucursal ? <p className={estilos.ayuda}>Elegí el día para ver los horarios.</p> : (
              <>
                {cargandoDisp && <Cargando texto="Consultando horarios" />}
                {errorDisp && <MensajeError mensaje={errorDisp} alReintentar={cargarDisponibilidad} />}
                {disp && !cargandoDisp && <GrillaHorarios disponibilidad={disp} valor={horaElegida} onCambio={(h) => actualizar({ hora: h })} />}
              </>
            )}
          </li>
        </ol>

        <aside className={estilos.resumen} aria-label="Tu reserva">
          <h2 className={estilos.tituloResumen}>Tu reserva</h2>
          {modelo.datos ? (
            <FotoAuto url={modelo.datos.imagenes[0]?.url} alt={`${modelo.datos.marcaNombre} ${modelo.datos.nombre}`}
              tipo={modelo.datos.tipoCarroceria} className={estilos.fotoResumen} />
          ) : <div className={estilos.fotoVacia} />}
          <dl className={estilos.datos}>
            <div><dt>Auto</dt><dd>{modelo.datos ? `${modelo.datos.marcaNombre} ${modelo.datos.nombre}` : '—'}</dd></div>
            {modelo.datos && <div><dt>Precio desde</dt><dd>{precio(modelo.datos.precioDesde)}</dd></div>}
            <div><dt>Sucursal</dt><dd>{sucursal ? sucursal.nombre : '—'}</dd></div>
            <div><dt>Día</dt><dd>{fecha ? fechaLarga(fecha) : '—'}</dd></div>
            <div><dt>Horario</dt><dd>{horaElegida ? `${hora(horaElegida)} a ${sumarMinutos(horaElegida, 60)}` : '—'}</dd></div>
          </dl>

          <label className="campo">
            <span>Algo que quieras avisarnos (opcional)</span>
            <textarea value={observaciones} maxLength={500} onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: quiero probarlo en ruta, voy con alguien más" />
          </label>

          {errorReserva && <Aviso tipo="error">{errorReserva}</Aviso>}

          <button type="button" className="btn btn--primario" disabled={!listo || enviando} onClick={confirmar}>
            {enviando ? 'Reservando…' : usuario ? 'Confirmar reserva' : 'Ingresar para confirmar'}
          </button>
          {usuario && usuario.rol !== 'CLIENTE' && (
            <p className={estilos.ayuda}>Estás con una cuenta de empleado: las reservas se hacen con una cuenta de cliente.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
