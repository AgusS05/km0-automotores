import { useMemo, useState } from 'react'
import { catalogo, compras, testDrives } from '../../api/api'
import type { TurnoTestDrive } from '../../api/tipos'
import { useAuth } from '../../auth/AuthContext'
import { useCarga } from '../../hooks/useCarga'
import { fechaLarga, hora, hoyIso, sumarDias } from '../../utils/formato'
import { EstadoBadge } from '../../components/EstadoBadge'
import { AccionesEstado } from '../../components/AccionesEstado'
import { NavegadorSemana, lunesDe } from '../../components/NavegadorSemana'
import { Cargando, MensajeError, Vacio } from '../../components/Estados'
import { TablaSolicitudes } from '../../components/TablaSolicitudes'
import estilos from './Panel.module.css'

/** @param enAdmin true cuando se muestra dentro del panel de administración (que ya pone el contenedor y el menú) */
export default function PanelVendedor({ enAdmin = false }: { enAdmin?: boolean }) {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'ADMIN'
  const [desde, setDesde] = useState(() => lunesDe(hoyIso()))
  const [sucursalId, setSucursalId] = useState<number | null>(null)
  const hasta = sumarDias(desde, 6)

  const sucursales = useCarga(() => (esAdmin ? catalogo.sucursales() : Promise.resolve([])), [esAdmin])
  const alertas = useCarga(() => testDrives.alertas(), [])
  const agenda = useCarga(() => testDrives.agenda(desde, hasta, { sucursalId }), [desde, hasta, sucursalId])
  // Solicitudes de compra del vendedor (el admin las gestiona en Admin → Ventas)
  const solicitudes = useCarga(() => (esAdmin ? Promise.resolve([]) : compras.listar()), [esAdmin])
  const abiertas = (solicitudes.datos ?? []).filter((s) => ['NUEVA', 'CONTACTADA', 'RESERVADA'].includes(s.estado))
  const cerradas = (solicitudes.datos ?? []).filter((s) => !abiertas.includes(s))

  const porDia = useMemo(() => {
    const mapa = new Map<string, TurnoTestDrive[]>()
    for (const t of agenda.datos ?? []) mapa.set(t.fecha, [...(mapa.get(t.fecha) ?? []), t])
    return [...mapa.entries()]
  }, [agenda.datos])

  async function cambiar(t: TurnoTestDrive, estado: TurnoTestDrive['estado']) {
    const nuevo = await testDrives.cambiarEstado(t.id, estado)
    agenda.setDatos((agenda.datos ?? []).map((x) => (x.id === nuevo.id ? nuevo : x)))
    alertas.setDatos((alertas.datos ?? []).filter((x) => x.id !== nuevo.id || nuevo.estado === 'PENDIENTE'))
  }

  return (
    <div className={enAdmin ? undefined : `contenedor ${estilos.pagina}`}>
      <header className={estilos.encabezado}>
        <div>
          <h1>{esAdmin ? 'Agenda de test drives' : 'Mi agenda'}</h1>
          <p className={estilos.bajada}>{esAdmin ? 'Todas las sucursales' : `${usuario?.nombre} ${usuario?.apellido}, ${usuario?.sucursalNombre ?? ''}`}</p>
        </div>
      </header>

      <section className={estilos.alertas} aria-labelledby="titulo-alertas">
        <h2 id="titulo-alertas">Para confirmar</h2>
        <p className={estilos.bajada}>Turnos pendientes de hoy a pasado mañana. Llamá al cliente y confirmalo, así no se pierde el horario.</p>
        {alertas.cargando && <Cargando />}
        {alertas.error && <MensajeError mensaje={alertas.error} alReintentar={alertas.recargar} />}
        {alertas.datos && alertas.datos.length === 0 && <p className={estilos.ok}>No hay turnos sin confirmar. Todo al día.</p>}
        {alertas.datos && alertas.datos.length > 0 && (
          <ul className={estilos.listaAlertas}>
            {alertas.datos.map((t) => (
              <li key={t.id}>
                <div>
                  <strong>{fechaLarga(t.fecha)}, {hora(t.horaInicio)}</strong>
                  <span>{t.cliente.nombreCompleto} quiere probar el {t.marcaNombre} {t.modeloNombre}</span>
                  {t.cliente.telefono && <a href={`tel:${t.cliente.telefono.replace(/\s|-/g, '')}`}>{t.cliente.telefono}</a>}
                  {esAdmin && <span>Vendedor: {t.vendedor.nombreCompleto}</span>}
                </div>
                <AccionesEstado estado={t.estado} fecha={t.fecha} horaInicio={t.horaInicio} onCambiar={(e) => cambiar(t, e)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {!esAdmin && (
        <section className={estilos.agenda} aria-labelledby="titulo-ventas">
          <h2 id="titulo-ventas">Solicitudes de compra</h2>
          <p className={estilos.bajada}>Clientes que pidieron presupuesto. Contactalos y actualizá el estado a medida que avanza la venta.</p>
          {solicitudes.cargando && <Cargando />}
          {solicitudes.error && <MensajeError mensaje={solicitudes.error} alReintentar={solicitudes.recargar} />}
          {solicitudes.datos && abiertas.length === 0 && <p className={estilos.ok}>No tenés solicitudes abiertas.</p>}
          {abiertas.length > 0 && (
            <TablaSolicitudes solicitudes={abiertas}
              onActualizada={(n) => solicitudes.setDatos((solicitudes.datos ?? []).map((s) => (s.id === n.id ? n : s)))} />
          )}
          {cerradas.length > 0 && (
            <details>
              <summary className={estilos.resumenCerradas}>Vendidas y descartadas ({cerradas.length})</summary>
              <TablaSolicitudes solicitudes={cerradas} onActualizada={() => {}} />
            </details>
          )}
        </section>
      )}

      <section className={estilos.agenda} aria-labelledby="titulo-agenda">
        <div className={estilos.barraAgenda}>
          <h2 id="titulo-agenda">Semana</h2>
          <NavegadorSemana desde={desde} onCambio={setDesde} />
          {esAdmin && (
            <label className="campo">
              <span className="visualmente-oculto">Sucursal</span>
              <select value={sucursalId ?? ''} onChange={(e) => setSucursalId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Todas las sucursales</option>
                {(sucursales.datos ?? []).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </label>
          )}
        </div>

        {agenda.cargando && <Cargando />}
        {agenda.error && <MensajeError mensaje={agenda.error} alReintentar={agenda.recargar} />}
        {agenda.datos && agenda.datos.length === 0 && <Vacio titulo="No hay test drives esta semana" />}

        {porDia.map(([fecha, turnos]) => (
          <div key={fecha} className={estilos.dia}>
            <h3 className={estilos.tituloDia}>{fechaLarga(fecha)} <span>{turnos.filter((t) => t.estado !== 'CANCELADO').length} turnos</span></h3>
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th scope="col">Hora</th><th scope="col">Cliente</th><th scope="col">Auto</th>
                    {esAdmin && <th scope="col">Vendedor</th>}
                    <th scope="col">Estado</th><th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {turnos.map((t) => (
                    <tr key={t.id} className={t.estado === 'CANCELADO' ? estilos.filaApagada : undefined}>
                      <td className={estilos.hora}>{hora(t.horaInicio)}</td>
                      <td>
                        <strong>{t.cliente.nombreCompleto}</strong>
                        <span className={estilos.sub}>{t.cliente.telefono ?? t.cliente.email}</span>
                        {t.observaciones && <span className={estilos.nota}>“{t.observaciones}”</span>}
                      </td>
                      <td>{t.marcaNombre} {t.modeloNombre}<span className={estilos.sub}>{t.versionNombre}, {t.patente}{esAdmin ? `, ${t.sucursalNombre}` : ''}</span></td>
                      {esAdmin && <td>{t.vendedor.nombreCompleto}</td>}
                      <td><EstadoBadge estado={t.estado} /></td>
                      <td><AccionesEstado estado={t.estado} fecha={t.fecha} horaInicio={t.horaInicio} onCambiar={(e) => cambiar(t, e)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
