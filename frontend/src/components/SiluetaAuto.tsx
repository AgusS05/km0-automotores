import type { TipoCarroceria } from '../api/tipos'

// Siluetas laterales simples (viewBox 200x80) para cuando no hay foto o no hay WebGL.
const PERFILES: Record<TipoCarroceria, string> = {
  SEDAN: 'M8 58 Q8 50 16 48 L58 44 Q72 30 96 27 L124 27 Q140 30 156 42 L184 46 Q192 48 192 56 L192 60 L8 60 Z',
  HATCHBACK: 'M14 58 Q14 50 22 48 L60 43 Q74 28 98 25 L150 25 Q164 30 172 46 L180 48 Q186 50 186 58 L186 60 L14 60 Z',
  SUV: 'M10 58 Q10 46 20 44 L56 40 Q68 22 90 20 L158 20 Q170 24 176 42 L186 44 Q192 46 192 56 L192 60 L10 60 Z',
  PICKUP: 'M6 58 Q6 46 14 44 L50 40 Q60 22 80 20 L110 20 Q116 22 118 40 L194 40 L194 60 L6 60 Z',
}
const RUEDAS: Record<TipoCarroceria, [number, number]> = {
  SEDAN: [48, 152], HATCHBACK: [50, 150], SUV: [50, 156], PICKUP: [44, 158],
}

export function SiluetaAuto({ tipo, color = '#9aa3ad', className }: { tipo: TipoCarroceria; color?: string; className?: string }) {
  const [r1, r2] = RUEDAS[tipo]
  return (
    <svg viewBox="0 0 200 80" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <ellipse cx="100" cy="72" rx="92" ry="5" fill="rgba(20,26,34,0.14)" />
      <path d={PERFILES[tipo]} fill={color} />
      {[r1, r2].map((x) => (
        <g key={x}>
          <circle cx={x} cy="60" r="13" fill="#1c2430" />
          <circle cx={x} cy="60" r="6.5" fill="#c9cdd3" />
        </g>
      ))}
    </svg>
  )
}
