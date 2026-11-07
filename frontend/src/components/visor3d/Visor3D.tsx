import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { TipoCarroceria } from '../../api/tipos'
import { construirAuto, type AutoConstruido } from './construirAuto'
import { SiluetaAuto } from '../SiluetaAuto'
import estilos from './Visor3D.module.css'

interface Props {
  tipo: TipoCarroceria
  color: string
  /** Texto accesible que describe qué auto se muestra */
  descripcion: string
  /** Tamaño compacto para el hero (sin la leyenda de ayuda) */
  compacto?: boolean
}

/**
 * Visor 3D interactivo: el auto sobre una plataforma, se gira arrastrando y se
 * acerca con la rueda / pellizcando. Gira solo hasta que el usuario lo toca
 * (salvo que el sistema pida reducir animaciones). Solo dibuja cuando está
 * visible en pantalla, para no gastar batería.
 */
export function Visor3D({ tipo, color, descripcion, compacto = false }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const autoRef = useRef<AutoConstruido | null>(null)
  const colorDestino = useRef(new THREE.Color(color))
  const [sinWebGL, setSinWebGL] = useState(false)
  const [tocado, setTocado] = useState(false)

  // El color se cambia con una transición corta (se interpola en cada cuadro).
  useEffect(() => {
    colorDestino.current.set(color)
  }, [color])

  useEffect(() => {
    const host = contenedor.current
    if (!host) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch {
      setSinWebGL(true)
      return
    }
    const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.9
    host.appendChild(renderer.domElement)

    const escena = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const entorno = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    escena.environment = entorno

    escena.add(new THREE.HemisphereLight(0xffffff, 0xb9c0c8, 0.2))
    const sol = new THREE.DirectionalLight(0xffffff, 1.1)
    sol.position.set(4, 7, 3)
    escena.add(sol)

    const auto = construirAuto(tipo, colorDestino.current.getStyle())
    autoRef.current = auto
    escena.add(auto.grupo)

    // Plataforma giratoria del showroom
    const radioPlataforma = auto.largo * 0.66
    const geoPlataforma = new THREE.CylinderGeometry(radioPlataforma, radioPlataforma + 0.04, 0.08, 96)
    const matPlataforma = new THREE.MeshStandardMaterial({ color: 0xdfe3e8, roughness: 0.55, metalness: 0.15 })
    const plataforma = new THREE.Mesh(geoPlataforma, matPlataforma)
    plataforma.position.y = -0.04
    escena.add(plataforma)
    const geoAro = new THREE.TorusGeometry(radioPlataforma + 0.02, 0.012, 8, 128)
    const matAro = new THREE.MeshStandardMaterial({ color: 0x1f3a93, metalness: 0.4, roughness: 0.4 })
    const aro = new THREE.Mesh(geoAro, matAro)
    aro.rotation.x = Math.PI / 2
    escena.add(aro)

    const camara = new THREE.PerspectiveCamera(28, 1, 0.1, 100)
    const distancia = auto.largo * 1.95
    camara.position.set(distancia * 0.74, auto.altura * 1.05, distancia * 0.72)

    const controles = new OrbitControls(camara, renderer.domElement)
    controles.target.set(0, auto.altura * 0.42, 0)
    const distanciaBase = camara.position.distanceTo(controles.target)
    controles.enableDamping = true
    controles.enablePan = false
    controles.minDistance = auto.largo * 1.3
    controles.maxDistance = auto.largo * 3.2
    controles.minPolarAngle = 0.35
    controles.maxPolarAngle = Math.PI / 2 - 0.06
    controles.autoRotate = !reducirMovimiento
    controles.autoRotateSpeed = 0.9

    // Si el usuario lo mueve, deja de girar solo; retoma a los 5 segundos sin tocarlo.
    let reanudar: number | undefined
    const alEmpezar = () => {
      controles.autoRotate = false
      window.clearTimeout(reanudar)
      setTocado(true)
    }
    const alTerminar = () => {
      if (reducirMovimiento) return
      reanudar = window.setTimeout(() => { controles.autoRotate = true }, 5000)
    }
    controles.addEventListener('start', alEmpezar)
    controles.addEventListener('end', alTerminar)

    const ajustarTamano = () => {
      const { clientWidth: w, clientHeight: h } = host
      if (w === 0 || h === 0) return
      renderer.setSize(w, h, false)
      camara.aspect = w / h
      // En visores angostos (celular) se aleja la cámara para que entre el auto completo
      const alejar = Math.max(1, 1.75 / camara.aspect)
      camara.position.sub(controles.target).setLength(distanciaBase * alejar).add(controles.target)
      controles.maxDistance = auto.largo * 3.2 * alejar
      camara.updateProjectionMatrix()
    }
    const observadorTamano = new ResizeObserver(ajustarTamano)
    observadorTamano.observe(host)
    ajustarTamano()

    let visible = true
    const observadorVisibilidad = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    observadorVisibilidad.observe(host)

    let cuadro = 0
    const reloj = new THREE.Clock()
    const animar = () => {
      cuadro = requestAnimationFrame(animar)
      const dt = Math.min(reloj.getDelta(), 0.1)
      if (!visible) return
      const pintura = autoRef.current?.pintura
      if (pintura && !pintura.color.equals(colorDestino.current)) {
        // Transición por tiempo (≈0,4 s), igual en una compu rápida o lenta
        pintura.color.lerp(colorDestino.current, reducirMovimiento ? 1 : 1 - Math.exp(-dt * 10))
        if (Math.abs(pintura.color.r - colorDestino.current.r) + Math.abs(pintura.color.g - colorDestino.current.g)
          + Math.abs(pintura.color.b - colorDestino.current.b) < 0.003) pintura.color.copy(colorDestino.current)
      }
      controles.update()
      renderer.render(escena, camara)
    }
    animar()

    return () => {
      cancelAnimationFrame(cuadro)
      window.clearTimeout(reanudar)
      observadorTamano.disconnect()
      observadorVisibilidad.disconnect()
      controles.removeEventListener('start', alEmpezar)
      controles.removeEventListener('end', alTerminar)
      controles.dispose()
      auto.liberar()
      autoRef.current = null
      geoPlataforma.dispose(); matPlataforma.dispose(); geoAro.dispose(); matAro.dispose()
      entorno.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [tipo])

  if (sinWebGL) {
    return (
      <div className={`${estilos.visor} ${compacto ? estilos.compacto : ''}`}>
        <SiluetaAuto tipo={tipo} color={color} className={estilos.silueta} />
      </div>
    )
  }

  return (
    <div className={`${estilos.visor} ${compacto ? estilos.compacto : ''}`}>
      <div ref={contenedor} className={estilos.lienzo} role="img" aria-label={descripcion} />
      {!compacto && (
        <p className={`${estilos.ayuda} ${tocado ? estilos.ayudaOculta : ''}`}>
          Arrastrá para girarlo. Usá la rueda del mouse o pellizcá para acercarte.
        </p>
      )}
    </div>
  )
}
