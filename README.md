# Propuesta de Proyecto — Trabajo Final Integrador
## Portal Multimarca de Venta y Reserva de Test Drive

## Datos generales

| Campo | Detalle |
|---|---|
| **Nombre del proyecto** | Km0 Automotores |
| **Tipo de cliente** | Inventiva propia — sitio ficticio inspirado en portales oficiales de concesionarias multimarca (ej. Toyota Argentina, Autocity) |
| **Integrantes** | Agustín Hurtado, Valentín Gonzalez Puleo, Luciano Wittmund |
| **Tutor** | Sergio Andrés Antonini |
| **Repositorio GitHub** | https://github.com/AgusS05/km0-automotores |
| **Sitio publicado** | https://km0-automotores-prueba.vercel.app |
| **API (Swagger)** | https://km0-backend-prueba.onrender.com/swagger-ui.html |

---

## 1. Identificación de la problemática

### Contexto
Km0 Automotores es una concesionaria multimarca que vende autos 0km de distintas marcas (Toyota, Volkswagen, Audi, BMW, Chevrolet, entre otras). Aun vendiéndose todas desde un mismo lugar, la coordinación de un test drive suele depender de un llamado telefónico, WhatsApp o una visita presencial, sin un sistema online que muestre en tiempo real qué vehículos y horarios están disponibles. Si la concesionaria además ofrece un servicio de escuela de manejo, esa agenda suele gestionarse por separado, sin integración con el resto de la operación.

### Actores y necesidades

| Actor | Rol | Necesidad principal |
|---|---|---|
| Cliente / comprador | Explora catálogo y reserva turnos | Ver modelos de varias marcas y agendar un test drive sin llamar por teléfono |
| Vendedor | Gestiona turnos y stock de demo por marca | Ver la agenda consolidada y evitar turnos duplicados o superpuestos |
| Instructor de manejo | Dicta clases de manejo (módulo opcional) | Ver su propia agenda de clases asignadas |
| Administrador del sitio | Carga marcas, modelos y disponibilidad | Mantener el catálogo y los horarios disponibles actualizados |

### Impacto medible
- Tiempo perdido por el comprador coordinando turnos vía teléfono/WhatsApp con cada concesionaria por separado.
- Turnos duplicados o superpuestos por falta de una agenda centralizada.
- Pérdida de leads (potenciales compradores) por demora en la respuesta de contacto.

### Validación del problema
*Km0 Automotores, una concesionaria que vende autos 0km de varias marcas, actualmente coordina los test drives de forma manual —por teléfono, WhatsApp o visita presencial—, sin visibilidad en tiempo real de qué vehículos y horarios están disponibles, lo que genera demoras, turnos perdidos y clientes que abandonan el interés de compra. Además, si ofrece clases de manejo como servicio adicional, esa agenda se gestiona aparte, sin integración con el resto del sitio. Una plataforma web propia podría centralizar el catálogo de las marcas que vende, la reserva de turnos de test drive en tiempo real, y opcionalmente la reserva de clases de manejo, todo desde un único lugar.*

- ¿Está ocurriendo ahora? Sí, es la forma habitual en que operan hoy las concesionarias, incluso las que venden varias marcas desde un mismo local.
- ¿Los afectados reconocen el problema? Sí: la demora en coordinar un test drive por teléfono o WhatsApp es una fricción típica en la búsqueda de auto 0km, incluso dentro de una misma concesionaria.
- ¿Existe solución parcial? La concesionaria puede coordinar turnos manualmente o con formularios de contacto genéricos, pero no hay una agenda online integrada que muestre disponibilidad en tiempo real ni conecte el test drive con la escuela de manejo.

---

## 2. Propuesta de valor

**Para el cliente (comprador):**
- Reserva de test drive 100% online, viendo franjas horarias realmente disponibles, sin llamar ni esperar respuesta.
- Recordatorio automático (email) antes del turno, para reducir el olvido.
- Comparador simple entre los modelos de interés, sin recorrer fichas sueltas.

**Para la concesionaria:**
- Agenda centralizada por vendedor y vehículo demo, evitando turnos duplicados o superpuestos entre marcas.
- Panel con métricas: modelos con más pedidos de test drive, franjas horarias más demandadas, tasa de inasistencia (no-shows).
- Alertas automáticas cuando un turno está por vencer sin confirmar, para que el vendedor haga seguimiento antes de perder el lead.

No alcanza con digitalizar el mismo cuaderno de turnos en una web: el valor está en que la plataforma detecte patrones (qué se pide más, quién no confirma) y dispare alertas útiles tanto para el cliente como para el vendedor.

---

## 3. Alcance y funcionalidades principales

| Funcionalidad | Incluye | Estimación |
|---|---|---|
| Arquitectura base + diseño de BD | Setup de repo, esqueleto Spring Boot + React, modelo de datos en PostgreSQL | 2 semanas (hasta 27/09 — 2.ª entrega) |
| Catálogo de vehículos | CRUD de marcas y modelos, ficha con specs básicas e imágenes | 2 semanas |
| Reserva de test drive | Selección de vehículo, sucursal, fecha y horario disponible, validación de superposición | 2 semanas |
| Panel de administración | Carga de marcas/modelos/disponibilidad, vista de turnos | 1 semana |
| Valor agregado (dashboard + alertas) | Métricas de turnos, recordatorio automático, alertas de no confirmación | 1 semana |
| Escuela de manejo *(extensión, si el tiempo lo permite)* | Reserva de clases con instructor | 1 semana |
| Despliegue, documentación y video | Deploy online, informe final, video explicativo | 1 semana (hasta 14/11) |

**Fuera de alcance por ahora:** pasarela de pago o financiación, comparador avanzado tipo Autocity (ver punto 4).

---

## 4. Análisis de competencia

| | Quién | Qué ofrece hoy | Qué NO ofrece |
|---|---|---|---|
| **Directo — sitios de marca** | Toyota Argentina, Volkswagen Argentina, Ford Argentina, Mercedes-Benz Argentina | Formulario de "solicitar test drive" por modelo; después te contacta un vendedor | No es un turno confirmado en el momento: es un pedido de contacto, sin ver disponibilidad horaria real |
| **Directo — concesionaria multimarca** | Autocity (Córdoba y otras ciudades; agrupa Renault, Fiat, Nissan, Peugeot, Jeep, VW) | Comparador de hasta 3 autos, pista física de test drive, agenda de preturno para service | El test drive no se reserva online con horario propio; no integra escuela de manejo |
| **Indirecto — portales/clasificados** | MercadoLibre Autos, AutoCosmos, DeMotores | Listado y comparación de fichas técnicas de múltiples marcas y concesionarias | No gestionan turnos ni contacto directo con una concesionaria puntual |

**Diferenciadores de Km0 Automotores:**
- Reserva de test drive con horario real disponible y confirmación inmediata (no un formulario que deriva a un llamado, como en los sitios de marca).
- Escuela de manejo integrada a la misma plataforma y agenda: ninguno de los competidores relevados la ofrece junto con la venta.
- Panel de métricas para la concesionaria (no solo para el cliente), pensado para reducir no-shows y detectar qué modelos generan más interés real.

---

## 5. Stack tecnológico propuesto

| Componente | Tecnología | Justificación |
|---|---|---|
| Frontend | React + TypeScript (Vite) | Es el lenguaje/stack que más dominamos actualmente; permite construir una SPA con la sensación de sitio "de marca" con buena velocidad de desarrollo. |
| Backend | Spring Boot (Java) + Spring Data JPA | Es la tecnología que estamos cursando actualmente en la carrera, y ya tenemos experiencia previa con Java y JPA por el proyecto de Food Store de Programación III. |
| Base de datos | PostgreSQL | Los datos tienen estructura bien definida y estable (marcas, modelos, sucursales, turnos, usuarios) con relaciones importantes entre entidades (FK: turno→vehículo→cliente→sucursal), y se necesita integridad transaccional (ACID) para evitar que dos personas reserven el mismo horario. Se integra de forma nativa con Spring Data JPA/Hibernate. |
| Control de versiones | GitHub | Uso obligatorio según la cátedra; repositorio único centralizando todo el proyecto. |
| Gestión de proyecto | GitHub Projects | Tablero Kanban simple para trazabilidad del equipo. |
| Asistencia IA | Claude (Anthropic) | Generación de código, tests y documentación a partir de las definiciones del equipo; todo lo generado se revisó y se probó. Detalle en [`docs/uso-de-ia.md`](./docs/uso-de-ia.md). |

### Justificación general
Elegimos React + TypeScript para el frontend porque es la tecnología que mejor dominamos hoy. Para el backend elegimos Spring Boot porque es lo que estamos viendo en este momento en la cursada —lo que reduce el costo de aprendizaje real dentro de un cronograma ya ajustado por la situación de excepción en la materia— y porque ya tenemos experiencia previa con Java/JPA del proyecto de Food Store. Elegimos PostgreSQL en lugar de una base no relacional porque el dominio del problema —catálogo con relaciones fijas y turnos que no pueden superponerse— encaja mejor con un esquema relacional con integridad transaccional, según los propios criterios técnicos de la guía de la cátedra (estructura estable, relaciones entre entidades, necesidad de ACID); frente a MySQL, la diferencia práctica para este proyecto es mínima, pero Postgres se integra de forma más directa con Spring Data JPA/Hibernate.

---

## 6. Plataforma de despliegue

| Componente | Plataforma sugerida |
|---|---|
| Frontend | Vercel |
| Backend | Render o Railway (Spring Boot se despliega vía Docker o buildpack Java) |
| Base de datos PostgreSQL | Render, Railway, Neon o Supabase (planes gratuitos para entorno académico) |

---

## 7. Organización del repositorio

```
/frontend            → React + TypeScript (Vite)
  src/api            → cliente HTTP y tipos de la API
  src/auth           → sesión y protección de rutas por rol
  src/components     → piezas reutilizables (visor 3D, selector de horarios, tarjetas…)
  src/pages          → una página por pantalla (+ panel/ de empleados y admin/)
/backend             → Spring Boot 3.5 + Spring Data JPA (Java 17)
  controller → service → repository   (capas)
  model, dto, mapper, security, config, exception
  src/main/resources/db/migration     → migraciones Flyway (crean la base)
  src/test           → tests unitarios (JUnit 5 + Mockito)
/database            → copia de los scripts SQL: esquema, datos iniciales y turnos de ejemplo
/docs                → diagrama ER, módulos, arquitectura, ADRs, diagramas, pruebas, uso de IA y guía del código
/.github/workflows   → integración continua: tests y build en cada push
docker-compose.yml   → PostgreSQL (y opcionalmente el backend) para desarrollo local
README.md            → este archivo
```

---

## 8. Diseño técnico

La documentación técnica está en `/docs`, para no duplicar contenido extenso en este README:

- **[`docs/esquema_bd_y_modulos.md`](./docs/esquema_bd_y_modulos.md)** → Diagrama entidad-relación (campos, tipos, claves), restricciones e índices, y los 7 módulos con su prioridad y estado.
- **[`docs/cambios-esquema.md`](./docs/cambios-esquema.md)** → Qué se cambió respecto del esquema aprobado en la Segunda Entrega y por qué.
- **[`docs/arquitectura.md`](./docs/arquitectura.md)** → Arquitectura en capas (Controller → Service → Repository), tecnologías y decisiones técnicas.
- **[`docs/decisiones-arquitectura.md`](./docs/decisiones-arquitectura.md)** → 6 decisiones de arquitectura (ADR) con alternativas y consecuencias.
- **[`docs/diagramas.md`](./docs/diagramas.md)** → Arquitectura (C4), capas, secuencias de reserva, login y recordatorios, y estados del turno.
- **[`docs/guia-del-codigo.md`](./docs/guia-del-codigo.md)** → Recorrido por los flujos principales (login, disponibilidad, reserva, estados, métricas), endpoints y tests.
- **[`docs/pruebas.md`](./docs/pruebas.md)** → Estrategia de pruebas, casos de prueba, métricas y defectos encontrados.
- **[`docs/uso-de-ia.md`](./docs/uso-de-ia.md)** → Cómo se usó la IA en el desarrollo y cómo se validó lo generado.
- **[`database/`](./database)** → Scripts SQL ejecutables.

Resumen rápido: base de datos relacional en PostgreSQL con 11 tablas (`marca`, `modelo`, `version`, `imagen_modelo`, `color_modelo`, `sucursal`, `usuario`, `vehiculo_demo`, `turno_test_drive`, `clase_manejo`, `solicitud_compra`); los turnos superpuestos se impiden con índices únicos parciales. Arquitectura en capas con frontend y backend desacoplados vía API REST, autenticación con JWT y roles.

### Capturas

| Inicio con visor 3D | Reserva de test drive |
|---|---|
| ![Inicio](./docs/img/capturas/inicio.png) | ![Reserva](./docs/img/capturas/reserva-paso.png) |
| **Panel del vendedor** | **Métricas del administrador** |
| ![Vendedor](./docs/img/capturas/vendedor.png) | ![Admin](./docs/img/capturas/admin.png) |

### Funcionalidades implementadas

| Quién | Qué puede hacer |
|---|---|
| Visitante | Ver el catálogo con filtros, la ficha de cada modelo con fotos y **visor 3D** (girar el auto y cambiarle el color), comparar hasta 3 versiones, ver horarios libres |
| Cliente | Registrarse, reservar test drives y clases de manejo, ver y cancelar sus turnos; pedir presupuesto de compra ("Quiero comprarlo") con simulación de cuotas e imprimirlo |
| Vendedor | Agenda semanal, alertas de turnos sin confirmar, confirmar / marcar si vino o no; seguimiento de sus solicitudes de compra (contactado, reservado, vendido) |
| Instructor | Agenda semanal de clases y cambio de estado |
| Administrador | Métricas; ventas (todas las solicitudes de compra, conversión y monto vendido); listado de todas las reservas (test drives y clases) con filtros, búsqueda de clientes, cambio de estado y descarga a Excel; ABM de marcas, modelos, versiones, fotos, colores, sucursales, unidades demo y empleados |

---

## 9. Cómo ejecutar el proyecto

**Requisitos:** Java 17+, Maven 3.9+, Node.js 20+ y Docker (o un PostgreSQL 16 instalado).

```bash
# 1. Base de datos
docker compose up -d db

# 2. Backend  →  http://localhost:8080   (Swagger: http://localhost:8080/swagger-ui.html)
cd backend
mvn spring-boot:run
#   Al arrancar, Flyway crea las tablas y carga los datos de ejemplo.

# 3. Frontend →  http://localhost:5173
cd frontend
npm install
npm run dev
```

Sin Docker: crear una base `km0_automotores` en PostgreSQL y, si el usuario o la contraseña no son
`postgres`/`postgres`, definir `DB_USER` y `DB_PASSWORD` antes de arrancar el backend
(todas las variables están en [`backend/.env.example`](./backend/.env.example)).

### Tests y calidad

```bash
cd backend && mvn verify       # tests unitarios + de integración contra PostgreSQL en Docker + reporte de cobertura
cd frontend && npm test        # tests unitarios y de componentes (Vitest)
cd frontend && npm run lint    # análisis estático (oxlint)
```

Los tests de integración usan Testcontainers: necesitan Docker abierto (si no está, se omiten).
GitHub Actions corre todo esto en cada push ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)).

---

### Fotos de los autos

Las fotos son reales, de [Wikimedia Commons](https://commons.wikimedia.org) (licencias libres con atribución).
Para descargarlas al proyecto, una sola vez y con internet:

```bash
node scripts/fotos/descargar-fotos.mjs --simular   # opcional: muestra qué fotos elegiría
node scripts/fotos/descargar-fotos.mjs             # descarga a frontend/public/fotos y genera los créditos
```

El script elige 3 fotos por modelo (exteriores, horizontales, con licencia libre), las guarda en el frontend,
genera la migración `R__fotos_modelos.sql` (Flyway la aplica al reiniciar el backend) y la lista de autores
en [`docs/creditos-fotos.md`](./docs/creditos-fotos.md). Detalle en [`scripts/fotos/README.md`](./scripts/fotos/README.md).

## 10. Usuarios de prueba

Contraseña de todos: **`Demo1234`**

| Rol | Email |
|---|---|
| Administrador | `admin@km0.com.ar` |
| Vendedor (Córdoba Centro) | `martin.ferreyra@km0.com.ar` |
| Instructor (Córdoba Centro) | `valeria.ponce@km0.com.ar` |
| Instructor (Córdoba Norte) | `gabriel.ortiz@km0.com.ar` |
| Cliente | `cliente@example.com` |

---

## 11. Despliegue

| Parte | Dónde | Configuración |
|---|---|---|
| Base de datos | Neon, PostgreSQL 16, región AWS US East 2 (Ohio) | Sin *connection pooling* (Flyway necesita conexión directa). No se usa la base gratuita de Render porque se borra a los 30 días |
| Backend | Render, Web Service con Docker, carpeta `backend`, región Ohio, plan Free | Variables `DB_URL` (`jdbc:postgresql://HOST/neondb?sslmode=require`), `DB_USER`, `DB_PASSWORD`, `JWT_SECRET` (botón Generate), `CORS_ORIGINS` (dominio de Vercel, exacto). Health check: `/api/marcas` |
| Frontend | Vercel, carpeta `frontend` | Variable `VITE_API_URL` con la URL del backend, sin `/` al final. `vercel.json` redirige las rutas a la SPA |

Publicado el 06/11/2026: frontend en https://km0-automotores-prueba.vercel.app y backend en https://km0-backend-prueba.onrender.com.
Cada push a `main` vuelve a publicar los dos. En el plan gratuito, el backend se suspende tras 15 minutos sin uso y el primer pedido tarda cerca de un minuto.

---

## 12. Estado de aprobación

- [ ] Aprobado por el tutor (Sergio Andrés Antonini)
- [ ] Aprobado por el comité de trabajo final
