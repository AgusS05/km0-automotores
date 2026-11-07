import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { catalogo } from '../api/api'
import { useCarga } from '../hooks/useCarga'
import { hora, nombreCarroceria, nombreCombustible, precio } from '../utils/formato'
import { FotoAuto } from '../components/FotoAuto'
import { Visor3D } from '../components/visor3d/Visor3D'
import { SelectorColor } from '../components/SelectorColor'
import { Cargando, MensajeError } from '../components/Estados'
import estilos from './ModeloDetalle.module.css'

type Vista = 'fotos' | '3d'

export default function ModeloDetalle() {
  const { id } = useParams()
  const { datos: modelo, error, cargando, recargar } = useCarga(() => catalogo.modelo(Number(id)), [id])
  const [vista, setVista] = useState<Vista>('fotos')
  const [fotoActual, setFotoActual] = useState(0)
  const [color, setColor] = useState('#A9AEB4')

  useEffect(() => {
    if (!modelo) return
    setFotoActual(0)
    setVista(modelo.imagenes.length > 0 ? 'fotos' : '3d')
    if (modelo.colores[0]) setColor(modelo.colores[0].hex)
    document.title = `${modelo.marcaNombre} ${modelo.nombre} 0 km — Km0 Automotores`
  }, [modelo])

  if (cargando && !modelo) return <div className="contenedor"><Cargando /></div>
  if (error || !modelo) {
    return (
      <div className={`contenedor ${estilos.pagina}`}>
        <MensajeError mensaje={error ?? 'No encontramos ese modelo.'} alReintentar={recargar} />
        <p style={{ marginTop: 16 }}><Link to="/modelos">Volver a los modelos</Link></p>
      </div>
    )
  }

  const foto = modelo.imagenes[fotoActual]
  const nombreCompleto = `${modelo.marcaNombre} ${modelo.nombre}`

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <nav className={estilos.migas} aria-label="Ubicación">
        <Link to="/modelos">Modelos</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/modelos?marca=${modelo.marcaId}`}>{modelo.marcaNombre}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{modelo.nombre}</span>
      </nav>

      <div className={estilos.principal}>
        <section className={estilos.medios} aria-label="Fotos y vista 3D">
          <div className={estilos.pestanas} role="tablist" aria-label="Cómo ver el auto">
            <button type="button" role="tab" aria-selected={vista === 'fotos'} className={estilos.pestana}
              onClick={() => setVista('fotos')} disabled={modelo.imagenes.length === 0}>
              Fotos {modelo.imagenes.length > 0 && <span className={estilos.cuenta}>{modelo.imagenes.length}</span>}
            </button>
            <button type="button" role="tab" aria-selected={vista === '3d'} className={estilos.pestana} onClick={() => setVista('3d')}>
              Girar en 3D
            </button>
          </div>

          {vista === 'fotos' && foto ? (
            <div className={estilos.galeria}>
              <FotoAuto url={foto.url} alt={`${nombreCompleto}, foto ${fotoActual + 1} de ${modelo.imagenes.length}`}
                tipo={modelo.tipoCarroceria} carga="eager" className={estilos.fotoPrincipal} />
              {modelo.imagenes.length > 1 && (
                <div className={estilos.miniaturas}>
                  {modelo.imagenes.map((img, i) => (
                    <button key={img.id} type="button" className={estilos.miniatura} aria-pressed={i === fotoActual}
                      aria-label={`Ver foto ${i + 1}`} onClick={() => setFotoActual(i)}>
                      <FotoAuto url={img.url} alt="" tipo={modelo.tipoCarroceria} />
                    </button>
                  ))}
                </div>
              )}
              {(foto.fuenteUrl || foto.credito) && (
                <p className={estilos.credito}>
                  Foto: {foto.credito ?? 'Wikimedia Commons'}
                  {foto.fuenteUrl && <> · <a href={foto.fuenteUrl} target="_blank" rel="noreferrer">ver original</a></>}
                </p>
              )}
            </div>
          ) : (
            <div className={estilos.vista3d}>
              <Visor3D tipo={modelo.tipoCarroceria} color={color} descripcion={`${nombreCompleto} en 3D`} />
              <div className={estilos.barra3d}>
                <SelectorColor colores={modelo.colores} valor={color} onCambio={setColor} />
                <p className={estilos.nota3d}>Representación del tipo de carrocería, pintada con los colores reales del modelo.</p>
              </div>
            </div>
          )}
        </section>

        <section className={estilos.resumen} aria-labelledby="nombre-modelo">
          <p className={estilos.marca}>{modelo.marcaNombre}</p>
          <h1 id="nombre-modelo" className={estilos.nombre}>{modelo.nombre}</h1>
          <p className={estilos.tipo}>{nombreCarroceria[modelo.tipoCarroceria]} {modelo.anio}</p>
          <p className={estilos.precio}><span>Desde</span> {precio(modelo.precioDesde)}</p>
          {modelo.descripcion && <p className={estilos.descripcion}>{modelo.descripcion}</p>}

          {modelo.colores.length > 0 && (
            <div className={estilos.colores}>
              <p className={estilos.etiqueta}>Colores disponibles</p>
              <SelectorColor colores={modelo.colores} valor={color} onCambio={(c) => { setColor(c); setVista('3d') }} />
            </div>
          )}

          <div className={estilos.acciones}>
            <Link to={`/test-drive?modelo=${modelo.id}`} className="btn btn--primario">Reservar test drive</Link>
            <Link to={`/comprar?modelo=${modelo.id}`} className="btn btn--secundario">Quiero comprarlo</Link>
            {modelo.versiones.length > 1 && (
              <Link to={`/comparar?versiones=${modelo.versiones.map((v) => v.id).join(',')}`} className="btn btn--secundario">
                Comparar versiones
              </Link>
            )}
          </div>
        </section>
      </div>

      <section className={estilos.bloque} aria-labelledby="titulo-versiones">
        <h2 id="titulo-versiones">Versiones y precios</h2>
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th scope="col">Versión</th><th scope="col">Motor</th><th scope="col">Potencia</th><th scope="col">Caja</th>
                <th scope="col">Combustible</th><th scope="col">Tracción</th><th scope="col" className={estilos.num}>Precio</th>
                <th scope="col"><span className="visualmente-oculto">Comprar</span></th>
              </tr>
            </thead>
            <tbody>
              {modelo.versiones.map((v) => (
                <tr key={v.id}>
                  <th scope="row" className={estilos.version}>{v.nombreVersion}</th>
                  <td>{v.motor ?? '—'}</td>
                  <td>{v.potenciaCv ? `${v.potenciaCv} CV` : '—'}</td>
                  <td>{v.transmision ?? '—'}</td>
                  <td>{nombreCombustible[v.combustible]}</td>
                  <td>{v.traccion ?? '—'}</td>
                  <td className={estilos.num}><strong>{precio(v.precio)}</strong></td>
                  <td><Link to={`/comprar?modelo=${modelo.id}&version=${v.id}`} className={estilos.linkComprar}>Quiero esta</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={estilos.aclaracion}>Precios de referencia en pesos, sin gastos de patentamiento ni flete.</p>
      </section>

      <section className={estilos.bloque} aria-labelledby="titulo-donde">
        <h2 id="titulo-donde">Dónde probarlo</h2>
        {modelo.sucursalesConDemo.length === 0 ? (
          <p className={estilos.aclaracion}>Por ahora no hay unidades de este modelo para test drive.</p>
        ) : (
          <ul className={estilos.sucursales}>
            {modelo.sucursalesConDemo.map((s) => (
              <li key={s.id}>
                <div>
                  <h3>{s.nombre}</h3>
                  <p>{s.direccion}, {s.ciudad}</p>
                  <p className={estilos.horario}>
                    Lun a vie {hora(s.horarioApertura)} a {hora(s.horarioCierre)}
                    {s.cierreSabado ? `. Sáb ${hora(s.horarioApertura)} a ${hora(s.cierreSabado)}` : '. Sábados cerrado'}
                  </p>
                </div>
                <Link to={`/test-drive?modelo=${modelo.id}&sucursal=${s.id}`} className="btn btn--secundario btn--chico">
                  Reservar acá
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
