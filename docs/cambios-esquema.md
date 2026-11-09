# Cambios respecto del esquema aprobado (Segunda Entrega)

Al implementar el sistema se mantuvieron las 8 entidades aprobadas y sus relaciones.
Se agregaron 2 tablas y algunas columnas que la implementación necesitó. Este documento
explica cada cambio y por qué, para que el tutor pueda revisarlos.

## Tablas nuevas

| Tabla | Por qué |
|---|---|
| `imagen_modelo` | La galería de fotos de cada modelo. Un modelo tiene varias fotos, por eso es una tabla aparte y no una columna. Guarda la página de origen de cada foto para cumplir con la licencia (créditos). |
| `color_modelo` | Los colores en los que se vende cada modelo. Los usa el visor 3D para pintar el auto y la ficha para mostrar las opciones. |
| `solicitud_compra` | Extensión posterior (migración `V4`): el cliente muestra interés en comprar una versión. Guarda una copia del precio y de la simulación del crédito para que el presupuesto no cambie si después se actualiza la lista de precios. Un índice único parcial evita dos solicitudes abiertas de la misma versión por cliente. |

## Columnas nuevas

| Tabla | Columnas | Por qué |
|---|---|---|
| `modelo` | `descripcion`, `destacado` | Texto de la ficha; `destacado` elige qué modelos aparecen en el inicio. |
| `version` | `potencia_cv`, `traccion`, `puertas`, `plazas` | Ficha técnica más completa para el comparador. |
| `sucursal` | `telefono`, `horario_apertura`, `horario_cierre`, `cierre_sabado` | Sin horario de atención no se pueden calcular los turnos disponibles. |
| `usuario` | `telefono`, `activo`, `creado_en` | El vendedor llama al cliente para confirmar; `activo` permite dar de baja un empleado sin borrar su historial de turnos. |
| `turno_test_drive` | `observaciones`, `recordatorio_enviado`, `creado_en` | Comentario del cliente; marcar que ya se mandó el recordatorio (para no repetirlo); fecha de reserva. |
| `clase_manejo` | `sucursal_id`, `transmision`, `observaciones`, `recordatorio_enviado`, `creado_en` | La clase se da en una sucursal concreta (si el instructor cambia de sucursal, el historial no se altera) y con caja manual o automática. |

## Cambio en la regla anti-superposición (el más importante)

**Antes:** `UNIQUE (vehiculo_demo_id, fecha, hora_inicio)` en `turno_test_drive`.

**Problema detectado:** un turno `CANCELADO` sigue existiendo como fila, así que con ese
`UNIQUE` el horario quedaba bloqueado para siempre aunque el cliente lo hubiera cancelado.

**Ahora:** índices únicos **parciales**, que solo consideran los turnos activos:

```sql
CREATE UNIQUE INDEX uq_turno_vehiculo_horario
    ON turno_test_drive (vehiculo_demo_id, fecha, hora_inicio)
    WHERE estado <> 'CANCELADO';
```

Se agregó la misma regla para que un vendedor no tenga dos turnos a la vez
(`uq_turno_vendedor_horario`) y un instructor no tenga dos clases a la vez
(`uq_clase_instructor_horario`). Se probó en PostgreSQL 16: el segundo turno igual es
rechazado, y después de cancelar el primero el horario se puede volver a reservar.

## Otros ajustes

- `CHECK` con los valores válidos de los campos tipo lista (rol, estado, carrocería, combustible, caja) y del formato de color `#RRGGBB`.
- `CHECK` que obliga a vendedores e instructores a tener sucursal.
- `UNIQUE` en nombre de marca, modelo dentro de la marca, versión dentro del modelo y nombre de sucursal.
- Índices compuestos pensados para las consultas reales: `(vendedor_id, fecha)` para la agenda y `(fecha, estado)` para disponibilidad, alertas y métricas.
- `precio` pasó de `NUMERIC(12,2)` a `NUMERIC(14,2)`: con precios en pesos, 12 dígitos quedaban justos.

## Lo que NO cambió

- Clientes y empleados siguen en una sola tabla `usuario`, diferenciados por `rol`
  (un solo login y una sola forma de validar permisos).
- El test drive se reserva sobre una **unidad física** (`vehiculo_demo`), no sobre la versión:
  así se sabe qué auto concreto se usa y se pueden tener varias unidades del mismo modelo.
