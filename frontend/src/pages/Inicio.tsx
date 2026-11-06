import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { catalogo } from '../api/api'
import type { ModeloDetalle } from '../api/tipos'
import { useCarga } from '../hooks/useCarga'
import { precio } from '../utils/formato'
import { Visor3D } from '../components/visor3d/Visor3D'
import { TarjetaModelo } from '../components/TarjetaModelo'
import { Cargando, MensajeError } from '../components/Estados'
import { SelectorColor } from '../components/SelectorColor'
import estilos from './Inicio.module.css'

function saturacion(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max === 0 ? 0 : (max - min) / max
}

export default function Inicio() {
  const destacados = useCarga(() => catalogo.modelos({ destacados: true }), [])
  const marcas = useCarga(() => catalogo.marcas(), [])
  const [elegidoId, setElegidoId] = useState<number | null>(null)
  const [detalle, setDetalle] = useState<ModeloDetalle | null>(null)
  const [color, setColor] = useState<string>('#5B7FA3')

  // El auto del visor arranca con el primer destacado (o el que elija el usuario)
  const porDefecto = destacados.datos?.find((m) => m.tipoCarroceria === 'SUV') ?? destacados.datos?.[0]
  const idActual = elegidoId ?? porDefecto?.id ?? null
  useEffect(() => {
    if (idActual == null) return
    let vigente = true
    catalogo.modelo(idActual).then((m) => {
      if (!vigente) return
      setDetalle(m)
      // Arranca con el color más vistoso del modelo (el de mayor saturación)
      const vistoso = [...m.colores].sort((a, b) => saturacion(b.hex) - saturacion(a.hex))[0]
      if (vistoso) setColor(vistoso.hex)
    }).catch(() => {})
    return () => { vigente = false }
  }, [idActual])

  return (
    <>
      <section className={estilos.hero}>
        <div className={`contenedor ${estilos.heroGrilla}`}>
          <div className={estilos.heroTexto}>
            <h1 className={estilos.titular}>Probalo antes de decidir.</h1>
            <p className={estilos.bajada}>
              Más de veinte modelos 0&nbsp;km de Toyota, Volkswagen, Audi, BMW, Mercedes-Benz y Chevrolet en un mismo lugar.
              Elegí el auto, la sucursal y el horario, y reservá tu test drive en el momento, sin llamar.
            </p>
            <div className={estilos.acciones}>
              <Link to={idActual ? `/test-drive?modelo=${idActual}` : '/test-drive'} className="btn btn--primario">
                Reservar test drive
              </Link>
              <Link to="/modelos" className="btn btn--secundario">Ver los modelos</Link>
            </div>
          </div>

          <div className={estilos.showroom}>
            {detalle ? (
              <>
                <div className={estilos.visor}>
                  <Visor3D
                    compacto
                    tipo={detalle.tipoCarroceria}
                    color={color}
                    descripcion={`${detalle.marcaNombre} ${detalle.nombre} en 3D, se puede girar arrastrando`}
                  />
                </div>
                <div className={estilos.ficha}>
                  <div>
                    <p className={estilos.fichaMarca}>{detalle.marcaNombre}</p>
                    <p className={estilos.fichaNombre}>{detalle.nombre}</p>
                    <p className={estilos.fichaPrecio}>Desde {precio(detalle.precioDesde)}</p>
                  </div>
                  <SelectorColor colores={detalle.colores} valor={color} onCambio={setColor} />
                  <Link to={`/modelos/${detalle.id}`} className={estilos.fichaLink}>Ver ficha y versiones</Link>
                </div>
              </>
            ) : destacados.error ? (
              <MensajeError mensaje={destacados.error} alReintentar={destacados.recargar} />
            ) : (
              <Cargando texto="Preparando el showroom" />
            )}
          </div>
        </div>

        {destacados.datos && destacados.datos.length > 1 && (
          <div className="contenedor">
            <div className={estilos.selectorModelo} role="group" aria-label="Elegí qué auto ver en 3D">
              {destacados.datos.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={m.id === idActual}
                  className={estilos.chip}
                  onClick={() => setElegidoId(m.id)}
                >
                  {m.nombre}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className={`contenedor ${estilos.seccion}`} aria-labelledby="titulo-marcas">
        <h2 id="titulo-marcas" className={estilos.tituloSeccion}>Marcas</h2>
        <ul className={estilos.marcas}>
          {(marcas.datos ?? []).map((m) => (
            <li key={m.id}>
              <Link to={`/modelos?marca=${m.id}`} className={estilos.marca}>
                <span className={estilos.marcaNombre}>{m.nombre}</span>
                <span className={estilos.marcaCantidad}>{m.cantidadModelos} {m.cantidadModelos === 1 ? 'modelo' : 'modelos'}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={`contenedor ${estilos.seccion}`} aria-labelledby="titulo-destacados">
        <div className={estilos.encabezadoSeccion}>
          <h2 id="titulo-destacados" className={estilos.tituloSeccion}>Destacados</h2>
          <Link to="/modelos">Ver todos los modelos</Link>
        </div>
        {destacados.cargando && <Cargando />}
        {destacados.error && <MensajeError mensaje={destacados.error} alReintentar={destacados.recargar} />}
        <div className={estilos.grilla}>
          {(destacados.datos ?? []).slice(0, 8).map((m) => <TarjetaModelo key={m.id} modelo={m} />)}
        </div>
      </section>

      <section className={`contenedor ${estilos.seccion}`} aria-labelledby="titulo-pasos">
        <h2 id="titulo-pasos" className={estilos.tituloSeccion}>Cómo reservar un test drive</h2>
        <ol className={estilos.pasos}>
          <li>
            <h3>Elegí el auto y la sucursal</h3>
            <p>Cada sucursal tiene sus propias unidades para probar. Te mostramos dónde está el modelo que te interesa.</p>
          </li>
          <li>
            <h3>Elegí día y horario</h3>
            <p>Ves solo los horarios que siguen libres, con el auto y un vendedor disponibles. Turnos de una hora, de lunes a sábado.</p>
          </li>
          <li>
            <h3>Vení con tu licencia</h3>
            <p>Te mandamos un recordatorio el día anterior. Si no podés ir, cancelás desde Mis turnos y el horario queda libre para otro.</p>
          </li>
        </ol>
      </section>

      <section className={estilos.escuela} aria-labelledby="titulo-escuela">
        <div className={`contenedor ${estilos.escuelaGrilla}`}>
          <div>
            <h2 id="titulo-escuela" className={estilos.escuelaTitulo}>¿Todavía no manejás? Aprendé con nosotros.</h2>
            <p className={estilos.escuelaTexto}>
              Clases individuales de una hora con instructores de la casa, en auto con caja manual o automática.
              Elegís el horario igual que un test drive.
            </p>
          </div>
          <Link to="/escuela" className="btn btn--claro">Reservar una clase</Link>
        </div>
      </section>
    </>
  )
}
