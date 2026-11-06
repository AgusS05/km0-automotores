import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { compras } from '../api/api'
import { useAuth } from '../auth/AuthContext'
import { useCarga } from '../hooks/useCarga'
import { fechaLarga, nombreCombustible, nombreFormaPago, precio } from '../utils/formato'
import { FotoAuto } from '../components/FotoAuto'
import { EstadoSolicitudBadge } from '../components/EstadoSolicitudBadge'
import { AccionesSolicitud } from '../components/AccionesSolicitud'
import { Aviso, Cargando, MensajeError } from '../components/Estados'
import estilos from './Presupuesto.module.css'

/**
 * Presupuesto de una solicitud de compra, pensado también para imprimir o guardar en PDF
 * (al imprimir se ocultan el menú, el pie y los botones). Lo ven el cliente, su vendedor y el admin.
 */
export default function Presupuesto() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const recienCreada = (location.state as { nueva?: boolean } | null)?.nueva === true
  const solicitud = useCarga(() => compras.obtener(Number(id)), [id])
  const [cancelando, setCancelando] = useState(false)

  // El título de la pestaña es también el nombre que Chrome propone al guardar el PDF
  const numero = solicitud.datos ? String(solicitud.datos.id).padStart(6, '0') : null
  useEffect(() => {
    if (!numero) return
    const anterior = document.title
    document.title = `Presupuesto ${numero} — Km0 Automotores`
    return () => { document.title = anterior }
  }, [numero])
  const [error, setError] = useState<string | null>(null)

  if (solicitud.cargando && !solicitud.datos) return <div className="contenedor"><Cargando texto="Armando el presupuesto" /></div>
  if (solicitud.error || !solicitud.datos) {
    return <div className="contenedor"><MensajeError mensaje={solicitud.error ?? 'No encontramos la solicitud.'} alReintentar={solicitud.recargar} /></div>
  }
  const s = solicitud.datos
  const esCliente = usuario?.rol === 'CLIENTE'
  const puedeCancelar = esCliente && (s.estado === 'NUEVA' || s.estado === 'CONTACTADA')
  const auto = `${s.marcaNombre} ${s.modeloNombre} ${s.versionNombre}`
  const emitido = s.creadoEn.slice(0, 10)

  async function cancelar() {
    setCancelando(true)
    setError(null)
    try { solicitud.setDatos(await compras.cancelar(s.id)) } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cancelar.') } finally { setCancelando(false) }
  }

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      {recienCreada && (
        <div className="no-imprimir">
          <Aviso tipo="ok">
            Listo, recibimos tu solicitud. {s.vendedor.nombreCompleto} te va a contactar para confirmar la unidad y las condiciones.
            Te mandamos una copia por email.
          </Aviso>
        </div>
      )}

      <div className={`${estilos.barra} no-imprimir`}>
        {esCliente
          ? <Link to="/mis-turnos">← Mis turnos y solicitudes</Link>
          : <button type="button" className="btn btn--fantasma btn--chico" onClick={() => navigate(-1)}>← Volver</button>}
        <div className={estilos.botones}>
          {!esCliente && <AccionesSolicitud estado={s.estado} onCambiar={async (nuevo) => solicitud.setDatos(await compras.cambiarEstado(s.id, nuevo))} />}
          {puedeCancelar && (
            <button type="button" className="btn btn--peligro btn--chico" disabled={cancelando} onClick={cancelar}>
              {cancelando ? 'Cancelando…' : 'Ya no me interesa'}
            </button>
          )}
          <button type="button" className="btn btn--primario btn--chico" onClick={() => window.print()}>Imprimir o guardar PDF</button>
        </div>
      </div>
      {error && <div className="no-imprimir"><Aviso tipo="error">{error}</Aviso></div>}

      <article className={estilos.hoja} aria-labelledby="titulo-presupuesto">
        <header className={estilos.membrete}>
          <div>
            <p className={estilos.marca}>Km0 Automotores</p>
            <p className={estilos.chico}>{s.sucursalNombre} · {s.sucursalDireccion}{s.sucursalTelefono ? ` · Tel. ${s.sucursalTelefono}` : ''}</p>
          </div>
          <div className={estilos.numero}>
            <h1 id="titulo-presupuesto">Presupuesto N° {String(s.id).padStart(6, '0')}</h1>
            <p className={estilos.chico}>Emitido el {fechaLarga(emitido)}</p>
            <EstadoSolicitudBadge estado={s.estado} />
          </div>
        </header>

        <section className={estilos.partes}>
          <div>
            <h2>Cliente</h2>
            <p><strong>{s.cliente.nombreCompleto}</strong></p>
            <p>{s.cliente.email}</p>
            {s.cliente.telefono && <p>{s.cliente.telefono}</p>}
          </div>
          <div>
            <h2>Te atiende</h2>
            <p><strong>{s.vendedor.nombreCompleto}</strong></p>
            <p>{s.vendedor.email}</p>
            <p>Sucursal {s.sucursalNombre}</p>
          </div>
        </section>

        <section className={estilos.vehiculo}>
          <FotoAuto url={s.imagenUrl} alt={auto} tipo={s.tipoCarroceria} carga="eager" className={estilos.foto} />
          <div>
            <h2>Vehículo 0 km</h2>
            <p className={estilos.nombreAuto}>{s.marcaNombre} {s.modeloNombre}</p>
            <p>Versión {s.versionNombre}</p>
            <dl className={estilos.ficha}>
              {s.motor && <div><dt>Motor</dt><dd>{s.motor}</dd></div>}
              {s.transmision && <div><dt>Caja</dt><dd>{s.transmision}</dd></div>}
              <div><dt>Combustible</dt><dd>{nombreCombustible[s.combustible]}</dd></div>
              <div><dt>Color</dt><dd>
                {s.colorHex && <span className={estilos.muestra} style={{ backgroundColor: s.colorHex }} />}
                {s.color ?? 'A definir con el vendedor'}
              </dd></div>
            </dl>
          </div>
        </section>

        <section>
          <h2>Precio y forma de pago</h2>
          <table className={estilos.cuentas}>
            <tbody>
              <tr><th scope="row">Precio de lista</th><td>{precio(s.precioLista)}</td></tr>
              <tr><th scope="row">Forma de pago</th><td>{nombreFormaPago[s.formaPago]}</td></tr>
              {s.formaPago === 'FINANCIADO' && s.anticipo != null && s.cuotas && s.cuotaEstimada && (
                <>
                  <tr><th scope="row">Anticipo</th><td>{precio(s.anticipo)}</td></tr>
                  <tr><th scope="row">Monto a financiar</th><td>{precio(s.montoFinanciado)}</td></tr>
                  <tr className={estilos.total}><th scope="row">{s.cuotas} cuotas fijas de</th><td>{precio(s.cuotaEstimada)}</td></tr>
                  <tr><th scope="row">Total en cuotas</th><td>{precio(s.totalCuotas)}</td></tr>
                  <tr><th scope="row">Total (anticipo + cuotas)</th><td>{precio(s.anticipo + (s.totalCuotas ?? 0))}</td></tr>
                </>
              )}
              {s.formaPago === 'CONTADO' && (
                <tr className={estilos.total}><th scope="row">Total a pagar</th><td>{precio(s.precioLista)}</td></tr>
              )}
              {s.formaPago === 'PLAN_AHORRO' && (
                <tr><th scope="row">Plan</th><td>El vendedor te presenta los planes de ahorro vigentes de {s.marcaNombre}.</td></tr>
              )}
              {s.entregaUsado && (
                <tr><th scope="row">Usado como parte de pago</th><td>{s.usadoDescripcion} (se cotiza en la concesionaria)</td></tr>
              )}
            </tbody>
          </table>
          {s.formaPago === 'FINANCIADO' && s.tnaReferencia != null && (
            <p className={estilos.chico}>
              Cuota calculada con sistema francés y una tasa nominal anual de referencia de {s.tnaReferencia} %.
              La tasa final depende de la entidad y de la aprobación del crédito.
            </p>
          )}
          {s.comentario && <p className={estilos.comentario}><strong>Tu comentario:</strong> {s.comentario}</p>}
        </section>

        <section>
          <h2>Próximos pasos</h2>
          <ol className={estilos.pasos}>
            <li>{s.vendedor.nombreCompleto} te contacta para confirmar disponibilidad del color y la fecha de entrega.</li>
            {s.formaPago === 'FINANCIADO' && <li>Si avanzás, se carga la solicitud de crédito con tu DNI y comprobantes de ingresos.</li>}
            {s.entregaUsado && <li>Llevás el usado a la sucursal para que lo revisen y te pasen la cotización.</li>}
            <li>Con la seña se reserva la unidad; el resto se abona antes del patentamiento y la entrega.</li>
          </ol>
        </section>

        <footer className={estilos.legal}>
          Presupuesto orientativo, no constituye una oferta vinculante. Precio de lista vigente al {fechaLarga(emitido)}, sujeto a
          cambios sin previo aviso; no incluye flete, patentamiento ni sellados. Km0 Automotores es un proyecto académico (UTN).
        </footer>
      </article>
    </div>
  )
}
