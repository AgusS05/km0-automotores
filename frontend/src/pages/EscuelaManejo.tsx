import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { clases } from '../api/api'
import type { ClaseManejo, Disponibilidad, Transmision } from '../api/tipos'
import { useAuth } from '../auth/AuthContext'
import { useCarga } from '../hooks/useCarga'
import { atiendeEseDia, fechaLarga, hora, nombreTransmision, sumarMinutos } from '../utils/formato'
import { SelectorDia } from '../components/SelectorDia'
import { GrillaHorarios } from '../components/GrillaHorarios'
import { Aviso, Cargando, MensajeError } from '../components/Estados'
import estilos from './Reserva.module.css'
import propios from './EscuelaManejo.module.css'

export default function EscuelaManejo() {
  const [params, setParams] = useSearchParams()
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const sucursalId = params.get('sucursal') ? Number(params.get('sucursal')) : null
  const transmision = (params.get('caja') as Transmision | null) ?? 'MANUAL'
  const instructorId = params.get('instructor') ? Number(params.get('instructor')) : null
  const fecha = params.get('fecha')
  const horaElegida = params.get('hora')

  const [observaciones, setObservaciones] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errorReserva, setErrorReserva] = useState<string | null>(null)
  const [confirmada, setConfirmada] = useState<ClaseManejo | null>(null)

  const sucursales = useCarga(() => clases.sucursales(), [])
  const instructores = useCarga(() => (sucursalId ? clases.instructores(sucursalId) : Promise.resolve([])), [sucursalId])
  const sucursal = sucursales.datos?.find((s) => s.id === sucursalId) ?? null

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

  const cargarDisponibilidad = useMemo(() => () => {
    if (!sucursalId || !fecha) { setDisp(null); return }
    setCargandoDisp(true)
    setErrorDisp(null)
    clases.disponibilidad(sucursalId, fecha, instructorId)
      .then(setDisp)
      .catch((e: Error) => setErrorDisp(e.message))
      .finally(() => setCargandoDisp(false))
  }, [sucursalId, fecha, instructorId])
  useEffect(() => { cargarDisponibilidad() }, [cargarDisponibilidad])

  const listo = sucursalId && fecha && horaElegida
  const instructorElegido = instructores.datos?.find((i) => i.id === instructorId)

  async function confirmar() {
    if (!listo) return
    if (!usuario) {
      navigate('/ingresar', { state: { desde: location.pathname + location.search, motivo: 'Ingresá o creá tu cuenta para confirmar la clase.' } })
      return
    }
    setEnviando(true)
    setErrorReserva(null)
    try {
      const clase = await clases.reservar({ sucursalId, fecha, horaInicio: horaElegida, transmision, instructorId, observaciones: observaciones || undefined })
      setConfirmada(clase)
      window.scrollTo({ top: 0 })
    } catch (e) {
      setErrorReserva(e instanceof Error ? e.message : 'No pudimos reservar la clase.')
      cargarDisponibilidad()
    } finally {
      setEnviando(false)
    }
  }

  if (confirmada) {
    return (
      <div className={`contenedor ${estilos.pagina}`}>
        <section className={estilos.confirmacion} aria-live="polite">
          <p className={estilos.check} aria-hidden="true">✓</p>
          <h1>Tu clase quedó reservada</h1>
          <p className={estilos.detalleConfirmacion}>
            {fechaLarga(confirmada.fecha)} a las {hora(confirmada.horaInicio)} con {confirmada.instructor.nombreCompleto},
            en {confirmada.sucursalNombre} ({confirmada.sucursalDireccion}). {nombreTransmision[confirmada.transmision]}.
          </p>
          <p>Si ya tenés licencia de aprendiz, traela. El día anterior te llega un recordatorio por email.</p>
          <div className={estilos.accionesConfirmacion}>
            <Link to="/mis-turnos" className="btn btn--primario">Ver mis turnos</Link>
            <button type="button" className="btn btn--secundario" onClick={() => { setConfirmada(null); actualizar({ fecha: null, hora: null }) }}>
              Reservar otra clase
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <header className={propios.encabezado}>
        <div>
          <h1>Escuela de manejo</h1>
          <p className={estilos.bajada}>Aprendé a manejar con instructores de la concesionaria, en el horario que te quede cómodo.</p>
        </div>
        <ul className={propios.datos}>
          <li><strong>60 minutos</strong> por clase, individual</li>
          <li><strong>Doble comando</strong> en todos los autos</li>
          <li><strong>Caja manual o automática</strong>, a elección</li>
        </ul>
      </header>

      <div className={estilos.cuerpo}>
        <ol className={estilos.pasos}>
          <li className={estilos.paso}>
            <h2 className={estilos.tituloPaso}>Sucursal</h2>
            {sucursales.error && <MensajeError mensaje={sucursales.error} alReintentar={sucursales.recargar} />}
            {sucursales.cargando && <Cargando />}
            <div className={estilos.opcionesSucursal} role="radiogroup" aria-label="Sucursal">
              {(sucursales.datos ?? []).map((s) => (
                <button key={s.id} type="button" role="radio" aria-checked={sucursalId === s.id} className={estilos.sucursal}
                  onClick={() => actualizar({ sucursal: String(s.id), instructor: null, hora: null })}>
                  <strong>{s.nombre}</strong>
                  <span>{s.direccion}, {s.ciudad}</span>
                </button>
              ))}
            </div>
          </li>

          <li className={`${estilos.paso} ${!sucursal ? estilos.inactivo : ''}`}>
            <h2 className={estilos.tituloPaso}>Auto e instructor</h2>
            <div className={propios.dosColumnas}>
              <fieldset className={propios.grupo}>
                <legend>Tipo de caja</legend>
                {(['MANUAL', 'AUTOMATICA'] as Transmision[]).map((t) => (
                  <label key={t} className={propios.radio}>
                    <input type="radio" name="caja" checked={transmision === t} onChange={() => actualizar({ caja: t })} />
                    {nombreTransmision[t]}
                  </label>
                ))}
              </fieldset>
              <label className="campo">
                <span>Instructor</span>
                <select value={instructorId ?? ''} disabled={!sucursal}
                  onChange={(e) => actualizar({ instructor: e.target.value || null, hora: null })}>
                  <option value="">El que esté libre</option>
                  {(instructores.datos ?? []).map((i) => <option key={i.id} value={i.id}>{i.nombreCompleto}</option>)}
                </select>
              </label>
            </div>
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

        <aside className={estilos.resumen} aria-label="Tu clase">
          <h2 className={estilos.tituloResumen}>Tu clase</h2>
          <dl className={estilos.datos}>
            <div><dt>Sucursal</dt><dd>{sucursal?.nombre ?? '—'}</dd></div>
            <div><dt>Caja</dt><dd>{transmision === 'MANUAL' ? 'Manual' : 'Automática'}</dd></div>
            <div><dt>Instructor</dt><dd>{instructorElegido?.nombreCompleto ?? 'El que esté libre'}</dd></div>
            <div><dt>Día</dt><dd>{fecha ? fechaLarga(fecha) : '—'}</dd></div>
            <div><dt>Horario</dt><dd>{horaElegida ? `${hora(horaElegida)} a ${sumarMinutos(horaElegida, 60)}` : '—'}</dd></div>
          </dl>
          <label className="campo">
            <span>Contanos tu experiencia (opcional)</span>
            <textarea value={observaciones} maxLength={500} onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: nunca manejé, o ya manejo pero quiero practicar estacionar" />
          </label>
          {errorReserva && <Aviso tipo="error">{errorReserva}</Aviso>}
          <button type="button" className="btn btn--primario" disabled={!listo || enviando} onClick={confirmar}>
            {enviando ? 'Reservando…' : usuario ? 'Confirmar clase' : 'Ingresar para confirmar'}
          </button>
        </aside>
      </div>
    </div>
  )
}
