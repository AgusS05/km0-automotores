import { useMemo, useState } from 'react'
import { catalogo, clases } from '../../api/api'
import type { ClaseManejo } from '../../api/tipos'
import { useAuth } from '../../auth/AuthContext'
import { useCarga } from '../../hooks/useCarga'
import { fechaLarga, hora, hoyIso, nombreTransmision, sumarDias } from '../../utils/formato'
import { EstadoBadge } from '../../components/EstadoBadge'
import { AccionesEstado } from '../../components/AccionesEstado'
import { NavegadorSemana, lunesDe } from '../../components/NavegadorSemana'
import { Cargando, MensajeError, Vacio } from '../../components/Estados'
import estilos from './Panel.module.css'

/** @param enAdmin true cuando se muestra dentro del panel de administración (que ya pone el contenedor y el menú) */
export default function PanelInstructor({ enAdmin = false }: { enAdmin?: boolean }) {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'ADMIN'
  const [desde, setDesde] = useState(() => lunesDe(hoyIso()))
  const [sucursalId, setSucursalId] = useState<number | null>(null)
  const hasta = sumarDias(desde, 6)

  const sucursales = useCarga(() => (esAdmin ? catalogo.sucursales() : Promise.resolve([])), [esAdmin])
  const agenda = useCarga(() => clases.agenda(desde, hasta, { sucursalId }), [desde, hasta, sucursalId])

  const porDia = useMemo(() => {
    const mapa = new Map<string, ClaseManejo[]>()
    for (const c of agenda.datos ?? []) mapa.set(c.fecha, [...(mapa.get(c.fecha) ?? []), c])
    return [...mapa.entries()]
  }, [agenda.datos])

  async function cambiar(c: ClaseManejo, estado: ClaseManejo['estado']) {
    const nueva = await clases.cambiarEstado(c.id, estado)
    agenda.setDatos((agenda.datos ?? []).map((x) => (x.id === nueva.id ? nueva : x)))
  }

  return (
    <div className={enAdmin ? undefined : `contenedor ${estilos.pagina}`}>
      <header className={estilos.encabezado}>
        <div>
          <h1>{esAdmin ? 'Agenda de la escuela de manejo' : 'Mis clases'}</h1>
          <p className={estilos.bajada}>{esAdmin ? 'Todas las sucursales' : `${usuario?.nombre} ${usuario?.apellido}, ${usuario?.sucursalNombre ?? ''}`}</p>
        </div>
      </header>

      <section className={estilos.agenda}>
        <div className={estilos.barraAgenda}>
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
        {agenda.datos && agenda.datos.length === 0 && <Vacio titulo="No hay clases esta semana" />}

        {porDia.map(([fecha, lista]) => (
          <div key={fecha} className={estilos.dia}>
            <h3 className={estilos.tituloDia}>{fechaLarga(fecha)} <span>{lista.filter((c) => c.estado !== 'CANCELADO').length} clases</span></h3>
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th scope="col">Hora</th><th scope="col">Alumno</th><th scope="col">Caja</th>
                    {esAdmin && <th scope="col">Instructor</th>}
                    <th scope="col">Estado</th><th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((c) => (
                    <tr key={c.id} className={c.estado === 'CANCELADO' ? estilos.filaApagada : undefined}>
                      <td className={estilos.hora}>{hora(c.horaInicio)}</td>
                      <td>
                        <strong>{c.cliente.nombreCompleto}</strong>
                        <span className={estilos.sub}>{c.cliente.telefono ?? c.cliente.email}</span>
                        {c.observaciones && <span className={estilos.nota}>“{c.observaciones}”</span>}
                      </td>
                      <td>{nombreTransmision[c.transmision]}</td>
                      {esAdmin && <td>{c.instructor.nombreCompleto}<span className={estilos.sub}>{c.sucursalNombre}</span></td>}
                      <td><EstadoBadge estado={c.estado} /></td>
                      <td><AccionesEstado estado={c.estado} fecha={c.fecha} horaInicio={c.horaInicio} onCambiar={(e) => cambiar(c, e)} /></td>
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
