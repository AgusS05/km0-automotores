# Guía del código (para el equipo y la defensa)

Recorrido por los flujos principales: dónde está cada cosa y qué pasa paso a paso.

## 1. Login

1. `pages/Ingresar.tsx` llama a `auth.ingresar()` (`auth/AuthContext.tsx`) → `POST /api/auth/login`.
2. `AuthController.login` → `AuthService.login`: busca el usuario por email y compara la contraseña con
   el hash BCrypt (`PasswordEncoder.matches`). Si falla, responde 401 con el mismo mensaje exista o no el
   email (para no revelar qué emails están registrados).
3. `JwtService.generarToken` firma un JWT con el id, email y rol, válido 24 horas.
4. El frontend guarda el token (`api/cliente.ts`) y lo manda en cada pedido como `Authorization: Bearer …`.
5. En cada pedido, `JwtAuthFilter` valida la firma, carga el usuario y, si está activo, lo deja autenticado.
   Los controladores lo reciben con `@AuthenticationPrincipal UsuarioAutenticado yo`.

## 2. Ver horarios disponibles de test drive

`GET /api/test-drives/disponibilidad?modeloId=2&sucursalId=1&fecha=2026-11-02`

`TestDriveService.disponibilidad`:
1. Si la fecha ya pasó o la sucursal no atiende ese día → devuelve un `motivo` y ningún horario.
2. `CalculadoraHorarios.horariosDelDia` genera los bloques de 1 hora según el horario de la sucursal
   (sábados hasta `cierre_sabado`, domingos nada).
3. Trae las unidades demo del modelo en la sucursal y los vendedores activos.
4. Trae la ocupación del día (`findOcupacionDelDia`: hora, unidad y vendedor de cada turno no cancelado).
5. Para cada bloque: `lugares = min(unidades libres, vendedores libres)`. Si el bloque empieza en menos
   de una hora, no se ofrece.

## 3. Reservar un test drive

`POST /api/test-drives` (solo rol CLIENTE) → `TestDriveService.reservar`:
1. Valida fecha y hora con `CalculadoraHorarios.validarReserva` (anticipación, hasta 30 días, horario de atención).
2. Verifica que el cliente no tenga otro test drive ni clase a esa hora.
3. Elige la primera unidad libre y el vendedor libre con menos turnos ese día.
4. `saveAndFlush`: el INSERT se ejecuta en el momento. Si otro cliente ganó el horario por milisegundos,
   el índice único parcial lo rechaza y `GlobalExceptionHandler` responde **409**
   "Ese horario se acaba de ocupar".
5. El frontend (`pages/ReservarTestDrive.tsx`) muestra la confirmación con el vendedor asignado.

## 4. Estados de un turno

Definidos en `model/EstadoTurno.java` (el frontend repite las mismas reglas en `components/AccionesEstado.tsx`):

```
PENDIENTE ──► CONFIRMADO ──► REALIZADO
    │             │      └─► AUSENTE
    └──► CANCELADO ◄┘
```

- El **cliente** cancela solo antes de que empiece (`ReglasTurno.validarCancelacionCliente`).
- El **vendedor** cambia solo sus turnos; el **admin**, cualquiera (`TestDriveService.cambiarEstado`).
- REALIZADO/AUSENTE se marcan recién cuando el turno empezó (`ReglasTurno.validarCambioEstado`).

## 5. Valor agregado: alertas, recordatorios y métricas

- **Alertas** (`GET /api/test-drives/alertas`): turnos PENDIENTES de hoy a pasado mañana; aparecen arriba
  en el panel del vendedor para que llame y confirme.
- **Recordatorios** (`service/RecordatorioScheduler`): cada hora busca los turnos y clases de mañana sin
  recordatorio, avisa al cliente (`NotificacionService`) y los marca como avisados.
- **Métricas** (`GET /api/admin/metricas`, `MetricasService`): conteos con `GROUP BY` en
  `TurnoTestDriveRepository` (por estado, modelo, horario y sucursal) y la tasa de asistencia
  `realizados / (realizados + ausentes)`.

## 5 bis. Reservas (panel del administrador)

`pages/admin/AdminReservas.tsx` (`/admin/reservas`) junta en una tabla los test drives y las clases de un
período. No necesitó endpoints nuevos: usa las agendas existentes (`GET /api/test-drives/agenda` y
`GET /api/clases/agenda`), que para el rol ADMIN devuelven las de todos los empleados (máximo 62 días).
La lógica pura está en `pages/admin/reservas.ts`: convertir ambos tipos a un formato común, ordenar,
buscar sin tildes, contar por estado y armar el CSV. Los filtros quedan en la URL; el link "Ver cuáles"
de Métricas abre este listado filtrado por pendientes.

## 5 ter. Solicitudes de compra ("Quiero comprarlo")

1. En la ficha del modelo, "Quiero comprarlo" lleva a `pages/Comprar.tsx` (`/comprar?modelo=…`). El cliente elige
   versión, color, forma de pago y si entrega un usado. Las elecciones quedan en la URL: si tiene que iniciar
   sesión, al volver el formulario sigue completo.
2. Si paga financiado, la cuota se simula en pantalla con `utils/financiacion.ts` (sistema francés, con la tasa,
   plazos y anticipo mínimo que devuelve `GET /api/solicitudes-compra/condiciones`, configurables en `application.yml`).
3. `POST /api/solicitudes-compra` → `SolicitudCompraService.crear`: valida color y usado, valida y recalcula la
   financiación con `service/reglas/CalculadoraFinanciacion` (la misma fórmula, en Java; los tests de ambos lados
   comprueban que den igual), copia el precio de lista y asigna el vendedor activo de la sucursal con menos
   solicitudes abiertas. El índice `uq_solicitud_abierta` impide dos solicitudes abiertas de la misma versión (409).
4. `pages/Presupuesto.tsx` (`/solicitudes/:id`) muestra el presupuesto; con "Imprimir o guardar PDF" se imprime
   sin menú ni botones (reglas `@media print` y clase `no-imprimir`).
5. El vendedor ve sus solicitudes en su panel y el admin todas en Admin → Ventas (`TablaSolicitudes`).
   Estados en `model/EstadoSolicitud.java`: NUEVA → CONTACTADA → RESERVADA → VENDIDA, y DESCARTADA desde cualquiera abierta.

## 6. Escuela de manejo

Igual que el test drive, pero el recurso limitado es el **instructor** (uno por horario).
`ClaseManejoService` permite elegir instructor o dejar que se asigne el que tenga menos clases.
Solo se ofrece en sucursales con instructores (`GET /api/clases/sucursales`).

## 7. Visor 3D

`components/visor3d/construirAuto.ts` arma el auto con geometría de three.js: el perfil lateral
(con los pasaruedas) se extruye a lo ancho con bordes redondeados; arriba va el habitáculo de vidrio,
con parantes pintados y el techo. Las proporciones cambian según la carrocería (sedán, hatchback, SUV,
pickup). `Visor3D.tsx` arma la escena (luces de estudio, plataforma giratoria), permite girar y acercar
con `OrbitControls`, cambia el color con una transición y solo dibuja cuando está en pantalla.
No es una réplica exacta de cada modelo (los modelos 3D oficiales no son de uso libre): las fotos
reales están en la pestaña Fotos.

## 8. Errores

Todas las excepciones pasan por `exception/GlobalExceptionHandler` y salen con el mismo formato
(`ErrorResponse`): `status`, `mensaje` y, si es un error de validación, `campos`. El frontend
(`api/cliente.ts`) lo convierte en `ApiError` y muestra `mensaje` al usuario.

| Código | Cuándo |
|---|---|
| 400 | JSON mal formado o validación de campos (`@Valid`) |
| 401 | Sin token, token vencido, o login incorrecto |
| 403 | El rol no corresponde, o el turno no es tuyo |
| 404 | No existe el recurso |
| 409 | Horario ocupado, email o patente repetidos, borrar algo con datos relacionados |
| 422 | Regla de negocio (domingo, fuera de horario, menos de 1 hora de anticipación…) |

## 9. Endpoints

La lista completa, con ejemplos para probar, está en Swagger: `http://localhost:8080/swagger-ui.html`
(botón **Authorize** para pegar el token).

| Método y ruta | Quién | Para qué |
|---|---|---|
| `POST /api/auth/registro` · `POST /api/auth/login` · `GET /api/auth/yo` | Público / logueado | Cuenta |
| `GET /api/marcas` · `/api/modelos` · `/api/modelos/{id}` · `/api/versiones` · `/api/sucursales` | Público | Catálogo |
| `GET /api/test-drives/disponibilidad` | Público | Horarios libres |
| `POST /api/test-drives` · `GET /mios` · `PATCH /{id}/cancelar` | Cliente | Reservar y gestionar |
| `GET /api/test-drives/agenda` · `/alertas` · `PATCH /{id}/estado` | Vendedor, admin | Agenda |
| `GET /api/clases/sucursales` · `/instructores` · `/disponibilidad` | Público | Escuela |
| `POST /api/clases` · `GET /mias` · `PATCH /{id}/cancelar` | Cliente | Reservar clases |
| `GET /api/clases/agenda` · `PATCH /{id}/estado` | Instructor, admin | Agenda de clases |
| `GET /api/solicitudes-compra/condiciones` | Público | Tasa, plazos y anticipo mínimo de referencia |
| `POST /api/solicitudes-compra` · `GET /mias` · `PATCH /{id}/cancelar` | Cliente | Pedir presupuesto y gestionarlo |
| `GET /api/solicitudes-compra/{id}` | Cliente dueño, vendedor asignado, admin | Ver el presupuesto |
| `GET /api/solicitudes-compra` · `PATCH /{id}/estado` | Vendedor, admin | Seguimiento de la venta |
| `/api/admin/**` (marcas, modelos, versiones, fotos, colores, sucursales, unidades, usuarios, métricas) | Admin | Administración |

## 10. Tests

- `CalculadoraHorariosTest` y `ReglasTurnoTest`: reglas puras (horarios, anticipación, estados).
- `TestDriveServiceTest`: la reserva con repositorios simulados (Mockito): asigna la unidad y el vendedor
  correctos, rechaza horarios llenos, clientes con otro turno y domingos.
- `integracion/ApiIntegracionTest`: levanta la aplicación entera contra un PostgreSQL real en Docker
  (Testcontainers) y prueba la API como lo haría el frontend: login, permisos, reserva, 409 por horario
  ocupado, cancelación, agenda del vendedor e índices de la base.
- Frontend: `*.test.ts(x)` junto a cada archivo (Vitest + Testing Library).

Backend: `mvn verify` dentro de `/backend` (cobertura en `target/site/jacoco/index.html`).
Frontend: `npm test` y `npm run test:coverage`. Detalle de casos y métricas en [`pruebas.md`](./pruebas.md).
