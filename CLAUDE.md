# Km0 Automotores — contexto para Claude Code

Trabajo Final Integrador de la Tecnicatura Universitaria en Programación (UTN). Portal de una
concesionaria multimarca ficticia de Córdoba: catálogo con visor 3D, reserva de test drive en tiempo
real, escuela de manejo, paneles para vendedor/instructor y administración con métricas.

- Equipo: Agustín Hurtado, Valentín Gonzalez Puleo, Luciano Wittmund. Tutor: Sergio Andrés Antonini.
- Entrega final (repo + deploy + informe + video en inglés): **14/11/2026**. Después, defensa oral.
- Hablar en español rioplatense, directo y práctico. Los textos de la interfaz van con voseo ("Elegí", "Reservá").

## Stack

- `backend/`: Spring Boot 3.5 (Java 17), Spring Data JPA, Spring Security + JWT (jjwt), Flyway, PostgreSQL 16, springdoc (Swagger).
- `frontend/`: React 19 + TypeScript 7 + Vite 8, react-router 8, three.js, CSS Modules. Tests con Vitest + Testing Library; lint con oxlint (typescript-eslint no soporta TS 7).
- `database/`: copia de las migraciones (la fuente de verdad está en `backend/src/main/resources/db/migration`).
- `docs/`: arquitectura, ADRs, diagramas (Mermaid + PNG), pruebas, uso de IA, guía del código.

## Comandos

```bash
docker compose up -d db                 # PostgreSQL en localhost:5432 (postgres/postgres)
cd backend && mvn spring-boot:run       # API en :8080, Swagger en /swagger-ui.html
cd backend && mvn verify                # tests unitarios + integración (Testcontainers, necesita Docker) + JaCoCo
cd frontend && npm run dev              # :5173
cd frontend && npm test                 # Vitest
cd frontend && npm run lint             # oxlint
cd frontend && npm run build            # tsc -b + vite build
```

Usuarios de prueba (contraseña `Demo1234`): `admin@km0.com.ar`, `martin.ferreyra@km0.com.ar` (vendedor),
`valeria.ponce@km0.com.ar` (instructora), `gabriel.ortiz@km0.com.ar` (instructor, Córdoba Norte), `cliente@example.com`.

## Arquitectura y convenciones

- Backend en capas: `controller` → `service` (+ `service/reglas`, lógica pura sin Spring) → `repository`.
  DTOs como `record` en `dto/`, mapeo en `mapper/`, errores con `ApiException` y subclases
  (404 `RecursoNoEncontradoException`, 409 `ConflictoException`, 422 `ReglaNegocioException`, 403 `AccesoDenegadoException`)
  que `GlobalExceptionHandler` convierte en `ErrorResponse`.
- Todo en español: clases, métodos, variables, mensajes. Javadoc en métodos públicos de servicios y `@Operation` en endpoints.
- **Base de datos:** nunca editar una migración ya aplicada (`V1`–`V5`); todo cambio va en `V6__descripcion.sql`
  y se copia a `database/`. Hibernate está en `ddl-auto: validate`.
- **Turnos superpuestos:** los impiden índices únicos parciales `WHERE estado <> 'CANCELADO'`
  (por unidad, vendedor e instructor). El servicio valida antes y guarda con `saveAndFlush`; la colisión da 409.
- **Hora:** en la lógica de negocio usar el `Clock` inyectado (`LocalDate.now(clock)`, zona `America/Argentina/Cordoba`),
  así los tests pueden fijar la fecha. Los `now()` sin clock solo están en marcas de auditoría (`creadoEn`, timestamp de errores).
- Estados de turno en `EstadoTurno.java`; el frontend repite las reglas en `components/AccionesEstado.tsx`: mantenerlos iguales.
- Frontend: llamadas a la API solo desde `src/api/api.ts` (usa `pedir()` de `cliente.ts`); tipos en `api/tipos.ts` espejo de los DTOs.
  Fechas como string ISO local (`utils/formato.ts`, sin pasar por UTC). Estado de filtros/reservas en la URL.
- Diseño: grises de showroom, tipografía Barlow / Barlow Condensed, azul patente Mercosur `#1F3A93` para acciones,
  amarillo de línea de ruta `#F5C518` solo en el logo odómetro. Tokens en `src/styles/tokens.css`.

## Fotos de los autos

- `scripts/fotos/descargar-fotos.mjs` (Node, sin dependencias) busca en Wikimedia Commons, filtra por licencia
  libre (sin NC/ND), formato horizontal y nombre del archivo, y descarga 3 por modelo a `frontend/public/fotos/`.
- Genera `R__fotos_modelos.sql` (migración **repetible** de Flyway: se reaplica sola si cambia; no editarla a mano),
  su copia `database/fotos_modelos.sql` y `docs/creditos-fotos.md`. Configuración en `scripts/fotos/fotos.config.json`
  (`archivos` para fijar fotos, `descartar` para sacarlas).
- `imagen_modelo.credito` guarda "Autor · Licencia" y `fuente_url` la página del archivo: se muestran en la ficha y en /creditos.

## Solicitudes de compra

- Módulo "Quiero comprarlo": `V4__solicitudes_compra.sql` (tabla `solicitud_compra` + 6 de ejemplo), `SolicitudCompraService`,
  `/api/solicitudes-compra`, páginas `Comprar.tsx` y `Presupuesto.tsx` (imprimible), `TablaSolicitudes` en panel del vendedor y Admin → Ventas.
- La cuota se calcula igual en `service/reglas/CalculadoraFinanciacion.java` y `utils/financiacion.ts`: si se cambia una, cambiar la otra
  (hay tests de los dos lados con el mismo valor esperado). Tasa, plazos y anticipo mínimo en `app.compras` de `application.yml`.
- `V5__mas_modelos_e_instructor.sql` suma Mercedes-Benz, 6 modelos y el instructor Gabriel Ortiz (Córdoba Norte). Busca por nombre, sin IDs fijos.
- `V4` y `V5` ya pueden estar aplicadas en otras máquinas: cambios nuevos van en `V6__...`.

## Documentación que hay que mantener al día

- Si cambia el esquema: `docs/esquema_bd_y_modulos.md` y `docs/cambios-esquema.md` (el tutor aprobó el esquema original).
- Si cambia un flujo: `docs/guia-del-codigo.md` y `docs/diagramas.md` (y volver a exportar los PNG de `docs/img/diagramas`).
- Si se agregan tests: `docs/pruebas.md`.

## Pendiente

- Correr `mvn verify` por primera vez en una máquina real (el backend se generó y compiló sin acceso a Maven Central) y anotar la cobertura de JaCoCo en `docs/pruebas.md`.
- Deploy hecho (06/11/2026): Vercel https://km0-automotores-prueba.vercel.app, Render https://km0-backend-prueba.onrender.com, Neon (Ohio). Si cambia el dominio de Vercel, actualizar `CORS_ORIGINS` en Render.
- Informe Técnico Final (20–40 páginas, DOCX + PDF) según la guía U5-T1, y video en inglés de 5–8 minutos (U5-T2).
- Commits: cada integrante sube lo que realmente hizo con su propia cuenta.
