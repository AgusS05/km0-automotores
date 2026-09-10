# Propuesta de Proyecto — Trabajo Final Integrador
## Portal Multimarca de Venta y Reserva de Test Drive

## Datos generales

| Campo | Detalle |
|---|---|
| **Nombre del proyecto** | Km0 Automotores* |
| **Tipo de cliente** | Inventiva propia — sitio ficticio inspirado en portales oficiales de concesionarias multimarca (ej. Toyota Argentina, Chevrolet Argentina) |
| **Integrantes** | Agustín Hurtado, Valentín Gonzalez Puleo, Luciano Wittmund |
| **Tutor** | Sergio Andrés Antonini |
| **Repositorio GitHub** | https://github.com/AgusS05/km0-automotores |

---

## 1. Identificación de la problemática

### Contexto
Los concesionarios que representan autos 0km publican su catálogo cada uno en su propio sitio, y la coordinación de un test drive suele depender de un llamado telefónico, un formulario de contacto genérico o una visita presencial. No existe, del lado del comprador, un lugar único donde comparar modelos de distintas marcas y reservar un turno en tiempo real. Del lado del concesionario, la agenda de turnos suele llevarse en planillas o cuadernos, sin visibilidad centralizada de la disponibilidad real de vehículos y vendedores.

### Actores y necesidades

| Actor | Rol | Necesidad principal |
|---|---|---|
| Cliente / comprador | Explora catálogo y reserva turnos | Ver modelos de varias marcas y agendar un test drive sin llamar por teléfono |
| Vendedor / concesionario | Gestiona turnos y stock de demo | Ver la agenda consolidada y evitar turnos duplicados o superpuestos |
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

Una solución tecnológica agrega valor acá porque:
- **Reduce costo de tiempo**: elimina llamados telefónicos y esperas de respuesta.
- **Habilita algo antes imposible**: consultar disponibilidad y reservar turno de test drive en tiempo real, sin necesidad de llamar o visitar el local, para cualquiera de las marcas que vende la concesionaria.
- **Mejora la experiencia medible**: menor tiempo entre el interés inicial y el turno confirmado, menos inasistencias gracias a la confirmación/recordatorio automático.

---

## 3. Alcance del MVP

**Incluye (primera versión):**
- Catálogo de vehículos organizado por marca y modelo (ficha con specs básicas e imágenes).
- Sistema de reserva de turnos para test drive (selección de vehículo, sucursal, fecha y horario disponible).
- Registro/login de usuarios (clientes).
- Panel de administración básico para cargar marcas, modelos y disponibilidad horaria.

**Queda fuera del MVP (a evaluar como extensión si el tiempo lo permite):**
- Reserva de clases de manejo con instructor (se plantea como módulo adicional, no crítico para el MVP inicial).
- Pasarela de pago o financiación.
- Comparador avanzado de modelos.

---

## 4. Stack tecnológico propuesto

| Componente | Tecnología | Justificación |
|---|---|---|
| Frontend | React + TypeScript (Vite) | Es el lenguaje/stack que más domino actualmente; permite construir una SPA con la sensación de sitio "de marca" (como Toyota Argentina) con buena velocidad de desarrollo. |
| Backend | Spring Boot (Java) + Spring Data JPA | Es la tecnología que estamos cursando actualmente en la carrera, y ya tengo experiencia previa con Java y JPA por el proyecto de Food Store de Programación III. |
| Base de datos | PostgreSQL | Los datos tienen estructura bien definida y estable (marcas, modelos, sucursales, turnos, usuarios) con relaciones importantes entre entidades (FK: turno→vehículo→cliente→sucursal), y se necesita integridad transaccional (ACID) para evitar que dos personas reserven el mismo horario. Se integra de forma nativa con Spring Data JPA/Hibernate. |
| Control de versiones | GitHub | Uso obligatorio según la cátedra; repositorio único centralizando todo el proyecto. |
| Gestión de proyecto | GitHub Projects | Tablero Kanban simple para trazabilidad del equipo. |
| Asistencia IA | GitHub Copilot / Claude | Para refactorización y unit testing; las decisiones de arquitectura y la lógica de negocio quedan a cargo del equipo. |

### Justificación general
Elegimos React + TypeScript para el frontend porque es la tecnología que mejor dominamos hoy. Para el backend elegimos Spring Boot porque es lo que estamos viendo en este momento en la cursada —lo que reduce el costo de aprendizaje real dentro de un cronograma ya ajustado por la situación de excepción en la materia— y porque ya tenemos experiencia previa con Java/JPA del proyecto de Food Store. Elegimos PostgreSQL en lugar de una base no relacional porque el dominio del problema —catálogo con relaciones fijas y turnos que no pueden superponerse— encaja mejor con un esquema relacional con integridad transaccional, según los propios criterios técnicos de la guía de la cátedra (estructura estable, relaciones entre entidades, necesidad de ACID); frente a MySQL, la diferencia práctica para este proyecto es mínima, pero Postgres se integra de forma más directa con Spring Data JPA/Hibernate.

---

## 5. Plataforma de despliegue

| Componente | Plataforma sugerida |
|---|---|
| Frontend | Vercel |
| Backend | Render o Railway (Spring Boot se despliega vía Docker o buildpack Java) |
| Base de datos PostgreSQL | Render, Railway, Neon o Supabase (planes gratuitos para entorno académico) |

---

## 6. Organización del repositorio

```
/frontend        → React + TypeScript
/backend         → Spring Boot + Spring Data JPA (Java)
/database        → scripts DDL/DML y diagrama ER
/docs            → informes y avances de entregas
README.md        → instrucciones de instalación, stack, integrantes
```

---

