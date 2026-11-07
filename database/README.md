# Base de datos

La base es **PostgreSQL 16**. Las tablas no se crean a mano: el backend usa **Flyway**,
que al arrancar ejecuta en orden los scripts de `backend/src/main/resources/db/migration`
y lleva registro de cuáles ya corrió (tabla `flyway_schema_history`).

En esta carpeta hay una copia de esos scripts para consultarlos sin entrar al backend:

| Archivo | Migración | Qué hace |
|---|---|---|
| `schema.sql` | `V1__esquema_inicial.sql` | Tablas, restricciones, índices únicos parciales e índices |
| `datos_iniciales.sql` | `V2__datos_iniciales.sql` | Marcas, 15 modelos, 34 versiones, fotos, colores, 3 sucursales, empleados, 31 clientes y 25 unidades demo |
| `turnos_demo.sql` | `V3__turnos_demo.sql` | Test drives y clases de las últimas 5 semanas y próximos días (para las métricas) |
| `solicitudes_compra.sql` | `V4__solicitudes_compra.sql` | Tabla de solicitudes de compra y 6 solicitudes de ejemplo |
| `mas_modelos_e_instructor.sql` | `V5__mas_modelos_e_instructor.sql` | Marca Mercedes-Benz y 6 modelos (SW4, A5 Sportback, Clase C, GLA, GLC, Virtus) con 16 versiones, colores y 12 unidades demo; un instructor en Córdoba Norte |
| `fotos_modelos.sql` | `R__fotos_modelos.sql` | Fotos reales descargadas con `scripts/fotos` (migración *repetible*: se reaplica cuando cambia). Aparece después de correr el script |

**Si se modifica el esquema**, no se edita un script ya ejecutado: se agrega uno nuevo
(`V6__descripcion.sql`) y se copia acá para mantener la documentación al día.

Para cargarlo a mano en una base vacía (sin el backend):

```bash
psql -U postgres -d km0_automotores -f schema.sql -f datos_iniciales.sql -f turnos_demo.sql
```

Contraseña de todos los usuarios de prueba: `Demo1234`.
El diagrama entidad-relación está en [`docs/esquema_bd_y_modulos.md`](../docs/esquema_bd_y_modulos.md).
