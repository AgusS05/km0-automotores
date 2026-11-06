import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

// Tests unitarios y de componentes: "npm test" (una vez) o "npm run test:watch" (mientras se programa).
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom', // DOM simulado para renderizar componentes de React
      include: ['src/**/*.test.{ts,tsx}'],
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        // Lógica que se puede probar sin navegador real (el visor 3D necesita WebGL)
        include: ['src/utils/**', 'src/api/cliente.ts', 'src/components/*.tsx', 'src/auth/**'],
        reporter: ['text', 'html'],
      },
    },
  }),
)
