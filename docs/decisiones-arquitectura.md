# Registro de decisiones de arquitectura (ADR)

Cada decisión sigue el formato que pide la guía del Informe Técnico Final (sección 9.3):
contexto, opciones consideradas, decisión adoptada y consecuencias.

---

## ADR-01 · PostgreSQL como base de datos

**Contexto.** El sistema guarda un catálogo con relaciones fijas (marca → modelo → versión → unidad demo)
y turnos que no pueden superponerse aunque dos personas reserven al mismo tiempo.

**Opciones consideradas.**
- **MongoDB:** esquema flexible, pero las relaciones se resuelven en la aplicación y las garantías
  de unicidad entre documentos son más limitadas.
- **MySQL:** relacional y transaccional; no tiene índices únicos parciales.
- **PostgreSQL:** relacional, ACID, índices únicos parciales (`WHERE ...`) y restricciones `CHECK`.

**Decisión.** PostgreSQL 16.

**Consecuencias.**
- (+) La regla "un vehículo no puede tener dos turnos activos a la misma hora" la garantiza la base, no solo el código (ver ADR-04).
- (+) Planes gratuitos en Render, Neon y Supabase para el despliegue.
- (−) Hace falta un servidor de base de datos también en desarrollo (se resolvió con `docker compose up -d db`).

---

## ADR-02 · Arquitectura en capas (monolito) en lugar de microservicios

**Contexto.** El dominio es acotado (catálogo, turnos, usuarios), el equipo es de tres personas y el
plazo es de unas siete semanas.

**Opciones consideradas.**
- **Microservicios** (catálogo, turnos, usuarios por separado): escalan por separado, pero suman
  despliegues, comunicación entre servicios y consistencia distribuida.
- **Monolito en capas** Controller → Service → Repository: un solo despliegue, transacciones locales.

**Decisión.** Monolito en capas con Spring Boot y frontend separado (SPA) que consume la API REST.

**Consecuencias.**
- (+) Una reserva (validar, elegir unidad y vendedor, guardar) es una sola transacción.
- (+) Cada capa se prueba por separado: reglas puras con JUnit, servicios con Mockito, la API completa con Testcontainers.
- (−) Si el sistema creciera mucho, separar módulos implicaría refactorizar. Los paquetes ya están organizados por responsabilidad para facilitarlo.

---

## ADR-03 · Autenticación con JWT sin sesión en el servidor

**Contexto.** Hay cuatro roles (cliente, vendedor, instructor, administrador) y el frontend está en otro
dominio (Vercel) que el backend (Render).

**Opciones consideradas.**
- **Sesión con cookie** (`JSESSIONID`): simple, pero entre dominios distintos requiere configurar cookies
  `SameSite=None`, CSRF y CORS con credenciales.
- **JWT en el header `Authorization`:** el servidor no guarda sesión; cada pedido trae el token firmado.
- **Proveedor externo** (Auth0, Firebase): agrega una dependencia y una cuenta externa.

**Decisión.** JWT firmado con HMAC (librería jjwt), válido 24 horas, contraseñas con BCrypt y permisos
por rol con Spring Security (`@PreAuthorize` y reglas por URL).

**Consecuencias.**
- (+) El backend puede reiniciarse o escalar sin perder sesiones.
- (+) En cada pedido se vuelve a leer el usuario de la base: un empleado dado de baja pierde el acceso aunque su token no haya vencido.
- (−) El token se guarda en `localStorage`, que es accesible por JavaScript: un ataque XSS podría leerlo. Se mitiga porque React escapa el contenido y no se usa `dangerouslySetInnerHTML`; queda como mejora futura pasar a cookie `HttpOnly`.
- (−) No hay "cerrar sesión en todos los dispositivos": el token vale hasta que vence.

---

## ADR-04 · Índices únicos parciales para impedir turnos superpuestos

**Contexto.** El esquema aprobado tenía `UNIQUE (vehiculo_demo_id, fecha, hora_inicio)`. Al implementar
la cancelación se detectó que un turno `CANCELADO` sigue ocupando la fila, así que el horario quedaba
bloqueado para siempre. Además, dos clientes pueden pedir el mismo horario en el mismo instante: ambos
pasan la validación del servicio antes de que cualquiera de los dos guarde.

**Opciones consideradas.**
- **Validar solo en el servicio:** no resuelve la carrera entre dos pedidos simultáneos.
- **Bloqueo pesimista** (`SELECT ... FOR UPDATE`) sobre la unidad: funciona, pero bloquea filas y complica el código.
- **Borrar el turno al cancelarlo:** se pierde el historial que usan las métricas (asistencia, cancelaciones).
- **Índice único parcial** `WHERE estado <> 'CANCELADO'`.

**Decisión.** Tres índices únicos parciales: por unidad, por vendedor y por instructor. El servicio valida
primero (para dar un mensaje claro) y guarda con `saveAndFlush`; si otro pedido ganó el horario, la base
rechaza el INSERT y la API responde **409 Conflict**.

**Consecuencias.**
- (+) La garantía no depende del código: vale aunque haya varias instancias del backend o un INSERT manual.
- (+) Cancelar libera el horario y se conserva el historial.
- (−) Es una característica de PostgreSQL: migrar a otra base requeriría otra solución.
- Verificado con un test de integración (`ApiIntegracionTest`) y a mano en PostgreSQL 16.

---

## ADR-05 · Migraciones versionadas con Flyway

**Contexto.** El esquema tiene que ser idéntico en la máquina de cada integrante, en los tests y en producción.

**Opciones consideradas.**
- **`ddl-auto=update` de Hibernate:** crea tablas a partir de las entidades, pero no crea índices parciales
  ni `CHECK`, y en producción puede hacer cambios no deseados.
- **Script SQL que se corre a mano:** fácil de olvidar o de correr dos veces.
- **Flyway:** scripts numerados (`V1`, `V2`, ...) que se ejecutan una sola vez y quedan registrados.

**Decisión.** Flyway crea el esquema y carga los datos de ejemplo al arrancar. Hibernate solo **valida**
que las entidades coincidan con las tablas (`ddl-auto: validate`).

**Consecuencias.**
- (+) Un clon nuevo del repositorio arranca con la base completa sin pasos manuales.
- (+) Si una entidad no coincide con la tabla, la aplicación no arranca (el error se ve enseguida).
- (−) Un script ya ejecutado no se edita: cada cambio es un script nuevo (`V4__...sql`).

---

## ADR-06 · Visor 3D generado por código en lugar de modelos 3D de cada auto

**Contexto.** La propuesta incluía "ver los autos y girarlos". Los modelos 3D oficiales de las marcas no
son de uso libre, y los de tiendas (Sketchfab, TurboSquid) tienen licencias pagas o pesan decenas de MB.

**Opciones consideradas.**
- **Modelos glTF por auto:** realistas, pero con problemas de licencia y de peso.
- **Fotos 360° (secuencia de imágenes):** no hay fotos libres de los 15 modelos.
- **Auto estilizado generado con three.js** según el tipo de carrocería, pintado con los colores reales de cada modelo.

**Decisión.** Geometría generada por código (`construirAuto.ts`) con proporciones por carrocería
(sedán, hatchback, SUV, pickup). Las fotos reales, con licencia libre (Wikimedia Commons), están en la pestaña "Fotos".

**Consecuencias.**
- (+) Sin problemas de licencia; three.js pesa ~150 kB comprimido y se descarga solo en las páginas con visor.
- (+) Agregar un modelo nuevo no requiere ningún archivo 3D.
- (−) No es una réplica exacta de cada modelo. Se aclara en la interfaz y en este documento.
- (−) Necesita WebGL; si el navegador no lo soporta se muestra una silueta.
