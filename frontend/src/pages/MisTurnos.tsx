import { Link } from 'react-router'
import { clases, compras, testDrives } from '../api/api'
import type { ClaseManejo, TurnoTestDrive } from '../api/tipos'
import { useAuth } from '../auth/AuthContext'
import { useCarga } from '../hooks/useCarga'
import { fechaCorta, nombreTransmision, precio, yaEmpezo } from '../utils/formato'
import { TarjetaTurno } from '../components/TarjetaTurno'
import { Cargando, MensajeError, Vacio } from '../components/Estados'
import { EstadoSolicitudBadge } from '../components/EstadoSolicitudBadge'
import { resumenPago } from '../components/TablaSolicitudes'
import estilos from './MisTurnos.module.css'

const activo = (t: { estado: string; fecha: string; horaInicio: string }) =>
  (t.estado === 'PENDIENTE' || t.estado === 'CONFIRMADO') && !yaEmpezo(t.fecha, t.horaInicio)

export default function MisTurnos() {
  const { usuario } = useAuth()
  const turnos = useCarga(() => testDrives.mios(), [])
  const misClases = useCarga(() => clases.mias(), [])
  const solicitudes = useCarga(() => compras.mias(), [])

  const reemplazarTurno = (t: TurnoTestDrive) => turnos.setDatos((turnos.datos ?? []).map((x) => (x.id === t.id ? t : x)))
  const reemplazarClase = (c: ClaseManejo) => misClases.setDatos((misClases.datos ?? []).map((x) => (x.id === c.id ? c : x)))

  const proximos = (turnos.datos ?? []).filter(activo).reverse()
  const anteriores = (turnos.datos ?? []).filter((t) => !activo(t))
  const clasesProximas = (misClases.datos ?? []).filter(activo).reverse()
  const clasesAnteriores = (misClases.datos ?? []).filter((c) => !activo(c))

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <header className={estilos.encabezado}>
        <h1>Hola, {usuario?.nombre}</h1>
        <div className={estilos.acciones}>
          <Link to="/test-drive" className="btn btn--primario">Reservar test drive</Link>
          <Link to="/escuela" className="btn btn--secundario">Reservar clase</Link>
        </div>
      </header>

      <section className={estilos.seccion} aria-labelledby="titulo-td">
        <h2 id="titulo-td">Test drives</h2>
        {turnos.cargando && <Cargando />}
        {turnos.error && <MensajeError mensaje={turnos.error} alReintentar={turnos.recargar} />}
        {turnos.datos && proximos.length === 0 && (
          <Vacio titulo="No tenés test drives próximos">
            <p>Elegí un modelo y reservá un horario; el turno aparece acá.</p>
            <Link to="/modelos" className="btn btn--secundario btn--chico">Ver modelos</Link>
          </Vacio>
        )}
        <div className={estilos.lista}>
          {proximos.map((t) => (
            <TarjetaTurno key={t.id} fecha={t.fecha} horaInicio={t.horaInicio} estado={t.estado}
              titulo={`${t.marcaNombre} ${t.modeloNombre}`}
              onCancelar={async () => reemplazarTurno(await testDrives.cancelar(t.id))}>
              <span>{t.versionNombre}, patente {t.patente}</span>
              <span>{t.sucursalNombre}: {t.sucursalDireccion}</span>
              <span>Te atiende {t.vendedor.nombreCompleto}</span>
            </TarjetaTurno>
          ))}
        </div>
        {anteriores.length > 0 && (
          <details className={estilos.historial}>
            <summary>Anteriores y cancelados ({anteriores.length})</summary>
            <div className={estilos.lista}>
              {anteriores.map((t) => (
                <TarjetaTurno key={t.id} fecha={t.fecha} horaInicio={t.horaInicio} estado={t.estado} titulo={`${t.marcaNombre} ${t.modeloNombre}`}>
                  <span>{t.sucursalNombre}</span>
                </TarjetaTurno>
              ))}
            </div>
          </details>
        )}
      </section>

      <section className={estilos.seccion} aria-labelledby="titulo-clases">
        <h2 id="titulo-clases">Clases de manejo</h2>
        {misClases.cargando && <Cargando />}
        {misClases.error && <MensajeError mensaje={misClases.error} alReintentar={misClases.recargar} />}
        {misClases.datos && clasesProximas.length === 0 && (
          <Vacio titulo="No tenés clases próximas">
            <Link to="/escuela" className="btn btn--secundario btn--chico">Reservar una clase</Link>
          </Vacio>
        )}
        <div className={estilos.lista}>
          {clasesProximas.map((c) => (
            <TarjetaTurno key={c.id} fecha={c.fecha} horaInicio={c.horaInicio} estado={c.estado}
              titulo={`Clase con ${c.instructor.nombreCompleto}`}
              onCancelar={async () => reemplazarClase(await clases.cancelar(c.id))}>
              <span>{nombreTransmision[c.transmision]}</span>
              <span>{c.sucursalNombre}: {c.sucursalDireccion}</span>
            </TarjetaTurno>
          ))}
        </div>
        {clasesAnteriores.length > 0 && (
          <details className={estilos.historial}>
            <summary>Anteriores y canceladas ({clasesAnteriores.length})</summary>
            <div className={estilos.lista}>
              {clasesAnteriores.map((c) => (
                <TarjetaTurno key={c.id} fecha={c.fecha} horaInicio={c.horaInicio} estado={c.estado} titulo={`Clase con ${c.instructor.nombreCompleto}`}>
                  <span>{c.sucursalNombre}</span>
                </TarjetaTurno>
              ))}
            </div>
          </details>
        )}
      </section>

      <section className={estilos.seccion} aria-labelledby="titulo-compras">
        <h2 id="titulo-compras">Solicitudes de compra</h2>
        {solicitudes.cargando && <Cargando />}
        {solicitudes.error && <MensajeError mensaje={solicitudes.error} alReintentar={solicitudes.recargar} />}
        {solicitudes.datos && solicitudes.datos.length === 0 && (
          <Vacio titulo="Todavía no pediste presupuesto">
            <p>En la ficha de cada modelo está el botón "Quiero comprarlo".</p>
            <Link to="/modelos" className="btn btn--secundario btn--chico">Ver modelos</Link>
          </Vacio>
        )}
        <div className={estilos.lista}>
          {(solicitudes.datos ?? []).map((s) => (
            <article key={s.id} className={estilos.solicitud}>
              <div className={estilos.cabeceraSolicitud}>
                <h3>{s.marcaNombre} {s.modeloNombre}</h3>
                <EstadoSolicitudBadge estado={s.estado} />
              </div>
              <p>{s.versionNombre}{s.color ? `, ${s.color}` : ''}</p>
              <p className={estilos.detalleSolicitud}>
                {resumenPago(s)} · Lista {precio(s.precioLista)}<br />
                Pedida el {fechaCorta(s.creadoEn.slice(0, 10))} · Te atiende {s.vendedor.nombreCompleto} ({s.sucursalNombre})
              </p>
              <Link to={`/solicitudes/${s.id}`} className="btn btn--secundario btn--chico">Ver presupuesto</Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
