# Pruebas y calidad

Corresponde a la sección 13 del Informe Técnico Final y al punto "Calidad y testing" de la Unidad 4.

## 1. Estrategia

| Tipo de prueba | ¿Incluida? | Herramienta | Qué cubre |
|---|---|---|---|
| Unitarias (backend) | Sí | JUnit 5 | Reglas de horarios y de estados, sin Spring ni base de datos |
| Unitarias con dobles (backend) | Sí | JUnit 5 + Mockito | `TestDriveService.reservar` con repositorios simulados |
| Integración (backend) | Sí | Spring Boot Test + MockMvc + Testcontainers | La API completa contra un PostgreSQL 16 real en Docker: seguridad, controladores, servicios, JPA, Flyway e índices |
| Unitarias (frontend) | Sí | Vitest | Formato de fechas y precios, cliente HTTP y manejo de errores |
| Componentes (frontend) | Sí | Vitest + Testing Library | Grilla de horarios, acciones de estado, protección de rutas por rol |
| Análisis estático | Sí | oxlint (frontend), `javac` + doclint (backend) | Errores de React, accesibilidad, Javadoc mal formado |
| Integración continua | Sí | GitHub Actions | Corre todo lo anterior en cada push (`.github/workflows/ci.yml`) |
| Sistema (E2E) | Manual | Navegador | Recorridos completos por rol (ver casos E2E abajo) |
| Usabilidad | Pendiente | — | A completar por el equipo si se hacen pruebas con usuarios |
| Rendimiento | No | — | Fuera de alcance |
| Seguridad | Parcial | Tests de integración | 401 sin token, 403 por rol, 403 al tocar turnos ajenos, contraseñas con BCrypt |

**Cómo correrlas**

```bash
cd backend && mvn verify          # unitarias + integración (las de integración necesitan Docker abierto)
                                  # cobertura en backend/target/site/jacoco/index.html
cd frontend && npm test           # unitarias y de componentes
cd frontend && npm run test:coverage
cd frontend && npm run lint       # análisis estático
```

Si Docker no está corriendo, los tests de integración se **omiten** (no fallan) y el resto se ejecuta igual.

## 2. Casos de prueba

### Backend — reglas de negocio (unitarias)

| ID | Descripción | Resultado esperado | Archivo |
|---|---|---|---|
| UT-01 | Un día hábil genera bloques de una hora hasta el cierre | Bloques de apertura a cierre − 1 h | `CalculadoraHorariosTest` |
| UT-02 | El sábado usa el horario de cierre del sábado | Bloques hasta el cierre del sábado | `CalculadoraHorariosTest` |
| UT-03 | Domingo, o sábado en una sucursal que no abre | Ningún horario | `CalculadoraHorariosTest` |
| UT-04 | Bloques de 90 minutos | No se ofrece uno que termine después del cierre | `CalculadoraHorariosTest` |
| UT-05 | Reserva válida | Sin motivo de rechazo | `CalculadoraHorariosTest` |
| UT-06 | Menos de una hora de anticipación | Rechazada | `CalculadoraHorariosTest` |
| UT-07 | Día demasiado lejano, domingo, horario fuera de atención | Rechazadas con su motivo | `CalculadoraHorariosTest` |
| UT-08 | Anticipación mínima en la grilla (`estaAlAlcance`) | Se respeta | `CalculadoraHorariosTest` |
| UT-09 | Transiciones válidas del ciclo de vida | Permitidas | `ReglasTurnoTest` |
| UT-10 | Estados finales y saltos (PENDIENTE → REALIZADO) | Rechazados | `ReglasTurnoTest` |
| UT-11 | Marcar asistencia antes de que empiece el turno | Rechazado | `ReglasTurnoTest` |
| UT-12 | El cliente cancela antes y después de que empiece | Antes sí, después no | `ReglasTurnoTest` |
| UT-13 | Reserva: primera unidad libre y vendedor con menos turnos | Asignación correcta | `TestDriveServiceTest` |
| UT-14 | Primera unidad ocupada | Usa la siguiente y un vendedor libre | `TestDriveServiceTest` |
| UT-15 | Todas las unidades ocupadas en ese horario | `ConflictoException` (409) | `TestDriveServiceTest` |
| UT-16 | El cliente ya tiene otro turno a esa hora | `ReglaNegocioException` (422) | `TestDriveServiceTest` |
| UT-17 | Reserva un domingo | `ReglaNegocioException` (422) | `TestDriveServiceTest` |
| UT-18 | La disponibilidad descuenta los horarios ocupados | Lugares correctos por bloque | `TestDriveServiceTest` |
| UT-19 | Cuota con sistema francés: 1.000.000 al 12 % anual en 12 cuotas | 88.848,79 | `CalculadoraFinanciacionTest` |
| UT-20 | Crédito con tasa 0 | Monto / cuotas | `CalculadoraFinanciacionTest` |
| UT-21 | Financiación válida (30 % de anticipo, 36 cuotas) | Sin motivo de rechazo | `CalculadoraFinanciacionTest` |
| UT-22 | Anticipo bajo, anticipo total, plazo no ofrecido, datos faltantes | Rechazados con su motivo | `CalculadoraFinanciacionTest` |
| UT-23 | Anticipo mínimo redondeado hacia arriba | 3.000.000 y 10 | `CalculadoraFinanciacionTest` |
| UT-24 | Embudo de venta: transiciones y estados abiertos | NUEVA no salta a VENDIDA; finales cerrados | `CalculadoraFinanciacionTest` |

### Backend — API completa contra PostgreSQL (integración)

Archivo: `backend/src/test/java/com/km0automotores/integracion/ApiIntegracionTest.java`

| ID | Descripción | Pasos | Resultado esperado |
|---|---|---|---|
| IT-01 | Catálogo público | `GET /api/modelos` sin token | 200 con los 21 modelos cargados por Flyway (15 de V2 y 6 de V5) |
| IT-02 | Ficha de modelo | `GET /api/modelos/1` | 200 con versiones, colores y sucursales con demo |
| IT-03 | Modelo inexistente | `GET /api/modelos/9999` | 404 con el formato de error de la API |
| IT-04 | Login correcto | `POST /api/auth/login` y luego `GET /api/auth/yo` con el token | 200, rol CLIENTE |
| IT-05 | Login incorrecto | Contraseña equivocada | 401 |
| IT-06 | Email repetido | Registrar `cliente@example.com` | 409 |
| IT-07 | Registro inválido | Email mal formado y contraseña corta | 400 con error por campo |
| IT-08 | Sin token | `POST /api/test-drives` sin `Authorization` | 401 |
| IT-09 | Rol incorrecto | Un vendedor intenta reservar | 403 |
| IT-10 | Métricas solo para admin | Admin y cliente piden `/api/admin/metricas` | 200 y 403 |
| IT-11 | **Flujo completo de reserva** | A reserva → el horario queda con 0 lugares → B pide el mismo horario → B intenta cancelar el turno de A → A cancela → B reserva | 201 → 409 → 403 → 200 (CANCELADO) → 201 |
| IT-12 | Agenda y confirmación del vendedor | Cliente reserva; el vendedor asignado ve el turno en su agenda, lo confirma e intenta marcarlo REALIZADO antes de tiempo | Aparece en la agenda → 200 CONFIRMADO → 422 |
| IT-13 | Domingo | Disponibilidad y reserva un domingo | Sin horarios con motivo; reserva 422 |
| IT-14 | Índice único parcial | Dos INSERT del mismo vehículo y horario; cancelar el primero; repetir | El segundo falla; tras cancelar, se acepta |
| IT-15 | CHECK de sucursal | Insertar un vendedor sin sucursal | Rechazado por la base |
| IT-16 | Condiciones de financiación públicas | `GET /api/solicitudes-compra/condiciones` sin token | 200 con tasa y plazos |
| IT-17 | **Flujo de solicitud de compra** | Cliente pide financiado (40 %) → repite → otro cliente abre el presupuesto → el vendedor asignado lo ve, intenta NUEVA→VENDIDA, avanza a CONTACTADA y RESERVADA → el cliente intenta cancelar | 201 con cuota y vendedor → 409 → 403 → aparece → 422 → 200 → 422 |
| IT-18 | Validaciones de compra | Anticipo menor al 30 %, color de otro modelo, usado sin descripción | 422 en los tres casos |

### Frontend (unitarias y de componentes)

| ID | Descripción | Archivo |
|---|---|---|
| FT-01 | Precio en pesos y "Consultar" si no hay precio | `utils/formato.test.ts` |
| FT-02 | Sumar días cruzando mes y año sin errores de zona horaria | `utils/formato.test.ts` |
| FT-03 | Qué días atiende una sucursal (domingo no; sábado según horario) | `utils/formato.test.ts` |
| FT-04 | Si un turno ya empezó, con el reloj simulado | `utils/formato.test.ts` |
| FT-05 | El cliente HTTP manda el token y el cuerpo JSON | `api/cliente.test.ts` |
| FT-06 | Un error del backend se convierte en `ApiError` con mensaje y campos | `api/cliente.test.ts` |
| FT-07 | Sin conexión → status 0; 401 con sesión → avisa que venció | `api/cliente.test.ts` |
| FT-08 | La grilla deshabilita horarios ocupados, marca "Último lugar" y avisa el elegido | `components/GrillaHorarios.test.tsx` |
| FT-09 | Los botones de estado siguen las reglas de `EstadoTurno.java` y muestran el error del servidor | `components/AccionesEstado.test.tsx` |
| FT-10 | Rutas protegidas: sin sesión → login (recordando a dónde volver); rol incorrecto → inicio | `auth/RequiereRol.test.tsx` |
| FT-11 | Navegación por semanas de la agenda | `components/NavegadorSemana.test.tsx` |
| FT-13 | Simulación de crédito en pantalla: mismas cuotas que el backend (incluido el ejemplo de la base) y mismas validaciones | `utils/financiacion.test.ts` |
| FT-12 | Listado de reservas del admin: unifica test drives y clases, ordena, busca sin tildes (también por teléfono) y exporta CSV para Excel | `pages/admin/reservas.test.ts` |

### Sistema (E2E, manual)

Para el informe, completar la columna "Resultado obtenido" al probar con el sistema desplegado.

| ID | Rol | Pasos | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| E2E-01 | Visitante | Inicio → elegir un modelo → pestaña "Girar en 3D" → cambiar color | El auto gira y cambia de color | |
| E2E-02 | Visitante → Cliente | Reservar test drive sin sesión → registrarse → volver a la reserva → confirmar | Vuelve al paso de la reserva y queda confirmada con vendedor asignado | |
| E2E-03 | Cliente | Mis turnos → cancelar un turno futuro | Pasa a "Cancelado" y el horario vuelve a estar libre | |
| E2E-04 | Vendedor | Panel → "Para confirmar" → Confirmar | El turno sale de alertas y aparece confirmado en la semana | |
| E2E-05 | Instructor | Panel → semana → marcar una clase pasada como "Vino" | Estado Realizado | |
| E2E-06 | Admin | Catálogo → nuevo modelo → agregar versión, foto y color | Aparece en el catálogo público | |
| E2E-07 | Admin | Métricas → cambiar el período | Los gráficos se actualizan | |
| E2E-08 | Cualquiera | Abrir en el celular | Sin desplazamiento horizontal; menú desplegable | |

## 3. Métricas

| Métrica | Valor |
|---|---|
| Tests backend | 24 unitarios + 18 de integración |
| Tests frontend | 47 (unitarios y de componentes), todos pasan |
| Cobertura frontend (líneas) | `utils/formato.ts` 94 %, `api/cliente.ts` 97 %, `GrillaHorarios` 100 %, `AccionesEstado` 100 %, `RequiereRol` 100 %; **51 % del total medido** (los componentes visuales sin lógica no tienen tests) |
| Cobertura backend | Se obtiene con `mvn verify` → `target/site/jacoco/index.html` (**completar con el valor real**) |
| Análisis estático frontend (oxlint) | Primera pasada: 8 errores de accesibilidad (celdas de tabla vacías sin texto para lectores de pantalla) → **corregidos**. Quedan 7 advertencias de React: 5 por `setState` dentro de `useEffect` (funcionan bien; se dejan como deuda técnica) y 2 por dependencias "extra" en efectos que son intencionales (cerrar el menú y volver arriba al cambiar de página) |
| Javadoc (doclint) | 2 errores de HTML en comentarios → corregidos; 0 errores |

## 4. Defectos encontrados durante el desarrollo

| # | Defecto | Cómo se detectó | Corrección |
|---|---|---|---|
| 1 | Un turno cancelado bloqueaba el horario para siempre | Revisión del esquema al implementar la cancelación | Índices únicos parciales (ADR-04) |
| 2 | Dos clientes podían pasar la validación del mismo horario a la vez | Análisis de concurrencia | `saveAndFlush` + índice único → 409 |
| 3 | La validación `@FutureOrPresent` usaba la hora del servidor (UTC) y rechazaba turnos válidos de la noche argentina | Prueba con fechas límite | Validación en el servicio con `Clock` en hora de Argentina |
| 4 | Un cliente de los datos de ejemplo quedaba con un test drive y una clase a la misma hora | Consulta de verificación sobre los datos generados | El script de datos verifica ambas tablas |
| 5 | Al cerrar sesión desde una página protegida, el siguiente login volvía a esa página | Prueba manual del recorrido | Cerrar sesión recarga el inicio |
| 6 | En el celular el auto 3D quedaba cortado | Captura en tamaño de celular | La cámara se aleja según la proporción de la pantalla |
| 7 | Celdas de encabezado vacías sin texto accesible | oxlint (jsx-a11y) | Texto oculto visualmente para lectores de pantalla |

## 5. Validación con usuarios

*Completar por el equipo si se realizan pruebas con usuarios: quiénes probaron (perfil), qué tareas
se les pidió, qué problemas encontraron y qué se cambió.*
