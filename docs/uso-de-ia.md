# Uso de inteligencia artificial en el proyecto

La cátedra pide documentar cómo se incorporó la IA al desarrollo (Unidad 4, "Desarrollo aumentado por IA";
Unidad 5, "Documentación automatizada"). Este documento lo registra con transparencia: qué hizo la IA,
qué decidió el equipo y cómo se validó lo generado.

## 1. Herramientas

| Herramienta | Para qué se usó |
|---|---|
| **Claude** (Anthropic), en modo agente | Redacción de la propuesta, revisión del modelo de datos, generación del código (backend, frontend y scripts de base de datos), tests, documentación técnica y diagramas |
| **Swagger / springdoc-openapi** | Documentación de la API generada automáticamente a partir del código y las anotaciones `@Operation` |
| **oxlint** | Análisis estático del frontend (errores de React y de accesibilidad) |
| *GitHub Copilot u otras* | *Completar si el equipo las usó* |

## 2. Qué decidió el equipo y qué generó la IA

| Lo definió el equipo | Lo generó la IA (a partir de esas definiciones) |
|---|---|
| El problema, los actores y la propuesta de valor | Redacción y estructura del README de la propuesta |
| El stack: React + TypeScript, Spring Boot, PostgreSQL | Código del backend (capas, seguridad, reglas de negocio) |
| Los módulos y su prioridad; sumar la escuela de manejo | Código del frontend, incluido el visor 3D |
| La estructura de carpetas del repositorio | Esquema SQL, migraciones y datos de ejemplo |
| La aprobación de cada entrega con el tutor | Tests unitarios, de integración y de componentes |
| El despliegue, el video y la defensa | Documentación técnica (ADRs, diagramas, guía del código) |

Ejemplo del pedido con el que se generó el proyecto (texto real del equipo):

> "Mi idea sería un proyecto con una página con un front end moderno, con imágenes varias de los autos,
> quizás la posibilidad de poder ver los autos, girarlos, etc. El backend organizado y optimizado. Y las
> bases de datos acordes, le mandamos de una a la posibilidad de turnos de test drive y escuela de manejo
> [...] Vas generando todo el proyecto según el README y la disposición de carpetas."

## 3. Usos concretos (según las categorías de la Unidad 4)

- **Generación de código base:** la estructura de los dos proyectos, la configuración (Spring Security,
  Flyway, Vite) y los ABM del panel de administración.
- **Lógica compleja:** el cálculo de disponibilidad (unidades y vendedores libres por horario), la
  asignación del vendedor con menos turnos y las transiciones de estado de un turno.
- **Optimización:** carga de relaciones en lote para evitar consultas N+1, consultas de agenda con
  `join fetch`, three.js en un archivo aparte que solo se descarga en las páginas con visor 3D.
- **Detección de errores y vulnerabilidades:** la revisión del esquema aprobado encontró que un turno
  cancelado bloqueaba el horario para siempre y que dos reservas simultáneas podían duplicarse
  (ver [ADR-04](./decisiones-arquitectura.md)). También se agregaron controles de seguridad: contraseñas
  con BCrypt, permisos por rol, y que un cliente no pueda cancelar turnos ajenos.
- **Testing:** generación de los casos de prueba de [`pruebas.md`](./pruebas.md).
- **Documentación automatizada:** Javadoc en servicios, JSDoc en el cliente de la API, anotaciones de
  Swagger en todos los endpoints, diagramas en Mermaid exportados a imagen.

## 4. Cómo se validó lo generado

La IA se equivoca, así que nada se dio por bueno sin comprobarlo:

| Verificación | Resultado |
|---|---|
| Esquema y datos ejecutados en PostgreSQL 16 real | Se probaron a mano los índices únicos parciales, los `CHECK` y que los datos de ejemplo no tuvieran turnos superpuestos |
| Compilación de todo el backend y de los tests | Sin errores |
| Tests de las reglas de negocio | Todos pasan |
| Frontend: chequeo de tipos de TypeScript, build de producción, 47 tests, oxlint | Sin errores |
| Recorridos completos en el navegador (capturas en `docs/img/capturas`) | Reserva, cancelación, panel del vendedor, administración, celular |

**Errores de la IA que se detectaron y corrigieron**, como ejemplo de por qué hay que revisar:

- Un script de PL/pgSQL con un error de sintaxis (faltaban paréntesis en una condición).
- Una validación de fecha que usaba la hora del servidor (UTC) en lugar de la de Argentina, y rechazaba turnos válidos a la noche.
- Una clase CSS duplicada y un import faltante en el frontend.
- El visor 3D mostraba los colores lavados en computadoras lentas (la transición de color dependía de los cuadros por segundo).
- Después de cerrar sesión, el siguiente login volvía a la página protegida anterior.
- Celdas de tablas sin texto para lectores de pantalla (lo detectó oxlint, no la revisión).

## 5. Limitaciones y riesgos

- El código generado **tiene que ser entendido por el equipo**: en la defensa oral se pregunta por
  decisiones y funcionamiento. Para eso está la [guía del código](./guia-del-codigo.md).
- No se compartieron datos reales ni contraseñas con la IA: todos los datos del sistema son ficticios.
- Las fotos de los autos son de Wikimedia Commons con su licencia; se citan en la página "Créditos".
- El visor 3D es una representación estilizada por tipo de carrocería, no un modelo exacto de cada auto.

## 6. Para completar por el equipo

- Qué revisó o modificó cada integrante sobre lo generado.
- Qué otras herramientas de IA usaron (Copilot, ChatGPT, etc.) y para qué.
- Reflexión: qué aprendieron usando IA y qué harían distinto.
