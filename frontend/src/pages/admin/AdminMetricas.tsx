import { useState } from 'react'
import { Link } from 'react-router'
import { admin } from '../../api/api'
import type { EstadoTurno } from '../../api/tipos'
import { useCarga } from '../../hooks/useCarga'
import { hoyIso, nombreEstado, sumarDias } from '../../utils/formato'
import { BarrasHorizontales, BarrasVerticales } from '../../components/Barras'
import { Cargando, MensajeError } from '../../components/Estados'
import estilos from './Admin.module.css'

const PERIODOS = [7, 30, 90]
const ORDEN_ESTADOS: EstadoTurno[] = ['REALIZADO', 'AUSENTE', 'CANCELADO', 'CONFIRMADO', 'PENDIENTE']
const COLOR_ESTADO: Record<EstadoTurno, string> = {
  REALIZADO: 'var(--c-libre)', AUSENTE: 'var(--c-error)', CANCELADO: '#9aa3ad', CONFIRMADO: 'var(--c-patente)', PENDIENTE: '#e0a800',
}

export default function AdminMetricas() {
  const [dias, setDias] = useState(30)
  const hasta = hoyIso()
  const desde = sumarDias(hasta, -dias)
  const m = useCarga(() => admin.metricas(desde, hasta), [desde, hasta])

  return (
    <div className={estilos.seccion}>
      <div className={estilos.barraTitulo}>
        <h1>Métricas</h1>
        <div className={estilos.segmentado} role="group" aria-label="Período">
          {PERIODOS.map((p) => (
            <button key={p} type="button" aria-pressed={dias === p} onClick={() => setDias(p)}>Últimos {p} días</button>
          ))}
        </div>
      </div>

      {m.cargando && !m.datos && <Cargando />}
      {m.error && <MensajeError mensaje={m.error} alReintentar={m.recargar} />}
      {m.datos && (
        <>
          <dl className={estilos.indicadores}>
            <div>
              <dt>Test drives en el período</dt>
              <dd>{m.datos.totalTestDrives}</dd>
            </div>
            <div>
              <dt>Asistencia</dt>
              <dd>{m.datos.tasaAsistencia == null ? '—' : `${Math.round(m.datos.tasaAsistencia * 100)}%`}</dd>
              <span className={estilos.aclaracion}>de los que tenían que venir, vinieron</span>
            </div>
            <div className={m.datos.sinConfirmar > 0 ? estilos.indicadorAlerta : undefined}>
              <dt>Sin confirmar (próximas 48 h)</dt>
              <dd>{m.datos.sinConfirmar}</dd>
              {m.datos.sinConfirmar > 0 && (
                <Link to={`/admin/reservas?estado=PENDIENTE&tipo=test&desde=${hasta}&hasta=${sumarDias(hasta, 2)}`} className={estilos.aclaracion}>Ver cuáles</Link>
              )}
            </div>
            <div>
              <dt>Clases de manejo</dt>
              <dd>{m.datos.totalClases}</dd>
            </div>
          </dl>

          <div className={estilos.paneles}>
            <section className={estilos.panel}>
              <h2>Estado de los test drives</h2>
              <BarraEstados porEstado={m.datos.testDrivesPorEstado} />
              <h2 className={estilos.segundoTitulo}>Estado de las clases de manejo</h2>
              <BarraEstados porEstado={m.datos.clasesPorEstado} />
            </section>

            <section className={estilos.panel}>
              <h2>Modelos más pedidos</h2>
              <BarrasHorizontales datos={m.datos.porModelo} />
            </section>

            <section className={estilos.panel}>
              <h2>Horarios más pedidos</h2>
              <BarrasVerticales datos={m.datos.porHorario.map((c) => ({ ...c, etiqueta: c.etiqueta.slice(0, 5) }))} titulo="Test drives por horario" />
            </section>

            <section className={estilos.panel}>
              <h2>Test drives por sucursal</h2>
              <BarrasHorizontales datos={m.datos.porSucursal} />
              <h2 className={estilos.segundoTitulo}>Clases por instructor</h2>
              <BarrasHorizontales datos={m.datos.clasesPorInstructor} />
            </section>
          </div>
        </>
      )}
    </div>
  )
}

function BarraEstados({ porEstado }: { porEstado: Record<EstadoTurno, number> }) {
  return (
    <>
      <div className={estilos.apilada} role="img"
        aria-label={ORDEN_ESTADOS.map((e) => `${nombreEstado[e]}: ${porEstado[e]}`).join(', ')}>
        {ORDEN_ESTADOS.map((e) => (porEstado[e] > 0 ? <span key={e} style={{ flexGrow: porEstado[e], background: COLOR_ESTADO[e] }} /> : null))}
      </div>
      <ul className={estilos.leyenda}>
        {ORDEN_ESTADOS.map((e) => (
          <li key={e}><span style={{ background: COLOR_ESTADO[e] }} />{nombreEstado[e]} <strong>{porEstado[e]}</strong></li>
        ))}
      </ul>
    </>
  )
}
