import { catalogo } from '../api/api'
import { useCarga } from '../hooks/useCarga'
import { Cargando } from '../components/Estados'

/** "https://commons.wikimedia.org/wiki/File:Toyota_Hilux.jpg" → "Toyota Hilux.jpg" */
function nombreArchivo(url: string): string {
  let texto = url
  try { texto = decodeURIComponent(url) } catch { /* URL con % sueltos: se muestra tal cual */ }
  return (texto.split('File:')[1] ?? texto).replace(/_/g, ' ')
}

/** Las fotos son de Wikimedia Commons (licencias libres): acá se listan autor, licencia y original de cada una. */
export default function Creditos() {
  const modelos = useCarga(async () => Promise.all((await catalogo.modelos()).map((m) => catalogo.modelo(m.id))), [])
  return (
    <div className="contenedor" style={{ paddingTop: 'var(--e-6)', display: 'grid', gap: 'var(--e-4)', maxWidth: 860 }}>
      <h1>Créditos de las fotos</h1>
      <p>
        Las fotos de los autos provienen de Wikimedia Commons y se usan bajo licencias libres que permiten reutilizarlas
        citando al autor (Creative Commons BY o BY-SA, o dominio público). Para cada foto figuran el autor, la licencia
        y el enlace al archivo original. Las marcadas como foto de prensa son de la marca y se usan solo con fines académicos.
      </p>
      {modelos.cargando && <Cargando />}
      {(modelos.datos ?? []).map((m) => (
        <section key={m.id}>
          <h2 style={{ fontSize: 'var(--t-md)' }}>{m.marcaNombre} {m.nombre}</h2>
          <ul>
            {m.imagenes.map((img, i) => (
              <li key={img.id}>
                Foto {i + 1}: {img.credito ?? 'autor sin indicar'}
                {img.fuenteUrl && <> · <a href={img.fuenteUrl} target="_blank" rel="noreferrer">{nombreArchivo(img.fuenteUrl)}</a></>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
