# Km0 Automotores — Arquitectura del Proyecto
## Segunda Entrega — Trabajo Final Integrador

## 1. Patrón de arquitectura elegido

**Arquitectura en capas (Layered Architecture)**, con frontend y backend separados y comunicados por una API REST.

```
┌─────────────────────────────┐
│   Frontend (React + TS)     │  ← Consume la API REST
└──────────────┬───────────────┘
               │ HTTP / JSON (REST API)
┌──────────────▼───────────────┐
│      Backend (Spring Boot)    │
│  ┌─────────────────────────┐  │
│  │  Controller (REST)      │  │  ← Recibe requests, valida entrada
│  ├─────────────────────────┤  │
│  │  Service (lógica)       │  │  ← Reglas de negocio (ej. no
│  │                         │  │     superponer turnos)
│  ├─────────────────────────┤  │
│  │  Repository (Spring     │  │  ← Acceso a datos (Spring Data JPA)
│  │  Data JPA)              │  │
│  └─────────────────────────┘  │
└──────────────┬───────────────┘
               │ JDBC
┌──────────────▼───────────────┐
│     PostgreSQL (base de datos)│
└───────────────────────────────┘
```

### Por qué esta arquitectura y no otra
- **No microservicios**: el proyecto tiene un dominio acotado (catálogo, turnos, usuarios) y un equipo de 3 personas con un plazo académico corto. Microservicios agregarían complejidad de infraestructura (orquestación, comunicación entre servicios) sin necesidad real, dado el volumen de datos y usuarios esperado.
- **Capas en el backend (Controller → Service → Repository)**: es el patrón estándar y nativo de Spring Boot, lo que reduce la curva de aprendizaje del equipo (justamente la tecnología que están cursando ahora) y separa responsabilidades: validación de entrada, lógica de negocio, y acceso a datos no se mezclan en un mismo archivo.
- **Frontend y backend desacoplados vía API REST** (en lugar de renderizado del lado del servidor): permite desplegarlos en plataformas distintas (Vercel para el frontend, Render/Railway para el backend), y que cada integrante pueda trabajar en su parte sin bloquear al resto.

---

## 2. Tecnologías definitivas

| Capa | Tecnología |
|---|---|
| Frontend | React + TypeScript (Vite) |
| Comunicación | API REST (JSON sobre HTTP) |
| Backend | Spring Boot (Java) + Spring Data JPA |
| Base de datos | PostgreSQL |
| Control de versiones | GitHub (repositorio único) |
| Despliegue | Vercel (frontend) / Render o Railway (backend) / Render, Railway o Neon (base de datos) |

*(La justificación de cada tecnología ya está detallada en el README, sección "Stack tecnológico propuesto".)*

---

## 3. Organización de carpetas del repositorio

```
/frontend        → Proyecto React + TypeScript (estructura inicial, sin lógica de negocio)
/backend         → Proyecto Spring Boot (estructura inicial: controller/, service/, repository/, model/ — sin lógica)
/database        → schema.sql (DDL) y este documento de arquitectura
/docs            → Documentación: esquema de BD, listado de módulos, arquitectura
README.md        → Descripción del proyecto, integrantes, stack y estado de aprobación
```

Cada carpeta principal (`/frontend`, `/backend`, `/database`, `/docs`) debe existir ya en el repositorio con al menos un archivo base (por ejemplo, la configuración inicial del proyecto generada por Vite o Spring Initializr), sin lógica de negocio todavía — el desarrollo de código comienza recién después de la aprobación de esta entrega.
