import { Link } from 'react-router'

export default function NoEncontrado() {
  return (
    <div className="contenedor" style={{ paddingTop: 'var(--e-8)', display: 'grid', gap: 'var(--e-4)', justifyItems: 'start' }}>
      <h1>Esta página no existe</h1>
      <p>Puede que el enlace esté mal escrito o que el modelo ya no esté en el catálogo.</p>
      <Link to="/modelos" className="btn btn--primario">Ver los modelos</Link>
    </div>
  )
}
