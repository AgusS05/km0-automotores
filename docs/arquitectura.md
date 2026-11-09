# Km0 Automotores — Arquitectura

## 1. Vista general

Arquitectura en capas, con frontend y backend separados que se comunican por una API REST con JSON.

```
┌──────────────────────────────┐
│  Frontend  React + TypeScript │  SPA (Vite). Visor 3D con three.js.
│  Vercel                       │  Guarda el token JWT y lo manda en cada pedido.
└──────────────┬───────────────┘
               │ HTTPS · JSON · Authorization: Bearer <token>
┌──────────────▼───────────────┐
│  Backend  Spring Boot 3.5     │
│  ┌─────────────────────────┐  │
│  │ security   JwtAuthFilter │  │ ← valida el token y carga el usuario
│  ├─────────────────────────┤  │
│  │ controller  (REST)       │  │ ← recibe el pedido, valida el JSON (@Valid), chequea rol (@PreAuthorize)
│  ├─────────────────────────┤  │
│  │ service  + service/reglas│  │ ← reglas de negocio (horarios, superposición, estados)
│  ├─────────────────────────┤  │
│  │ repository (Spring Data) │  │ ← consultas JPQL / derivadas
│  └─────────────────────────┘  │
│  Render o Railway              │
└──────────────┬───────────────┘
               │ JDBC
┌──────────────▼───────────────┐
│  PostgreSQL 16                │  Esquema creado por Flyway (migraciones versionadas).
│  Render / Neon / Supabase     │  Índices únicos parciales impiden turnos superpuestos.
└──────────────────────────────┘
```

## 2. Por qué esta arquitectura

- **Capas y no microservicios:** el dominio es acotado (catálogo, turnos, usuarios) y el equipo es chico.
  Microservicios agregarían infraestructura (varios despliegues, comunicación entre servicios) sin necesidad real.
- **Controller → Service → Repository** es el patrón nativo de Spring Boot: cada capa tiene una sola
  responsabilidad y se puede probar por separado.
- **Frontend y backend desacoplados:** se despliegan en plataformas distintas y cada uno se puede
  desarrollar sin bloquear al otro. La API está documentada en Swagger (`/swagger-ui.html`).
- **Reglas de negocio puras** (`service/reglas`): el cálculo de horarios y las transiciones de estado
  no dependen de Spring ni de la base, así que se prueban con tests unitarios simples.

## 3. Tecnologías

| Capa | Tecnología | Para qué |
|---|---|---|
| Frontend | React 19 + TypeScript + Vite | SPA con carga diferida de páginas |
| Ruteo | React Router | URLs para cada pantalla; filtros y reservas guardados en la URL |
| 3D | three.js | Visor 3D del auto (se descarga solo en las páginas que lo usan) |
| Backend | Spring Boot 3.5 (Java 17) | API REST |
| Seguridad | Spring Security + JWT (jjwt) + BCrypt | Login sin sesión en el servidor, contraseñas hasheadas |
| Persistencia | Spring Data JPA (Hibernate) | Entidades y repositorios |
| Migraciones | Flyway | Crea y versiona el esquema de la base |
| Base de datos | PostgreSQL 16 | Relacional, transaccional, con índices parciales |
| Documentación API | springdoc-openapi (Swagger UI) | Probar los endpoints desde el navegador |
| Tests backend | JUnit 5, Mockito, Testcontainers, JaCoCo | Reglas, servicio de reservas y API completa contra PostgreSQL real; cobertura |
| Tests frontend | Vitest + Testing Library | Utilidades, cliente HTTP y componentes |
| Calidad | oxlint, GitHub Actions | Análisis estático y CI en cada push |
| Despliegue | Vercel (front), Render/Railway (back), Docker | |

## 4. Estructura del backend

```
com.km0automotores
├── config         AppProperties (application.yml), SecurityConfig, ClockConfig, OpenApiConfig
├── security       JwtService, JwtAuthFilter, UsuarioAutenticado
├── model          Entidades JPA y enums (EstadoTurno con sus transiciones)
├── repository     Interfaces Spring Data con consultas JPQL
├── dto            Lo que entra y sale de la API (records), separado de las entidades
├── mapper         Entidad → DTO
├── service        Lógica de cada módulo
│   └── reglas     Reglas puras: CalculadoraHorarios, ReglasTurno
├── controller     Endpoints REST
└── exception      Excepciones de negocio y GlobalExceptionHandler (formato único de error)
```

## 5. Estructura del frontend

```
src
├── api            Cliente HTTP, tipos (espejo de los DTOs) y funciones por módulo
├── auth           Contexto de sesión y protección de rutas por rol
├── components     Piezas reutilizables (visor 3D, selector de día, grilla de horarios, tarjetas…)
├── hooks          useCarga: datos/cargando/error de un pedido
├── pages          Una por pantalla; panel/ (vendedor, instructor) y admin/
├── styles         Tokens de diseño y estilos globales
└── utils          Formato de precios, fechas y nombres
```

## 6. Decisiones de diseño relevantes

- **Disponibilidad en tiempo real:** el servidor calcula para cada horario cuántas unidades del modelo
  y cuántos vendedores siguen libres. El horario se ofrece si hay al menos uno de cada uno.
- **Concurrencia:** si dos personas confirman el mismo horario a la vez, ambas pasan el chequeo del servicio,
  pero el índice único parcial de Postgres rechaza la segunda; el backend responde 409 y el frontend
  refresca la grilla.
- **Reparto del trabajo:** al reservar, se asigna el vendedor (o instructor) libre con menos turnos ese día.
- **Hora de Argentina:** el backend usa un `Clock` configurado en `America/Argentina/Cordoba`,
  así el "hoy" no depende de la zona horaria del servidor (Render corre en UTC).
- **N+1:** `open-in-view` desactivado, `join fetch` en las consultas de agenda y `default_batch_fetch_size`
  para cargar relaciones en lote.
- **Notificaciones:** si no hay SMTP configurado, los recordatorios se registran en el log; con
  `MAIL_ENABLED=true` y datos SMTP se envían por email sin cambiar código.
