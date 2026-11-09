# Diagramas del sistema

Los diagramas están en [Mermaid](https://mermaid.js.org/): GitHub los muestra como imagen directamente.
Las mismas figuras exportadas en PNG (para el informe) están en [`img/diagramas/`](./img/diagramas).
Si se modifica un diagrama, se puede volver a exportar desde [mermaid.live](https://mermaid.live).

## 1. Arquitectura general (modelo C4, nivel de contenedores)

```mermaid
flowchart LR
    cliente(["Cliente<br/>explora el catálogo y reserva"])
    empleado(["Vendedor / Instructor<br/>gestiona su agenda"])
    admin(["Administrador<br/>catálogo, sucursales, métricas"])

    subgraph sistema["Km0 Automotores"]
        spa["<b>Frontend SPA</b><br/>React 19 + TypeScript + Vite<br/>three.js (visor 3D)<br/><i>Vercel</i>"]
        api["<b>API REST</b><br/>Spring Boot 3.5 · Java 17<br/>Spring Security + JWT<br/><i>Render (Docker)</i>"]
        db[("<b>Base de datos</b><br/>PostgreSQL 16<br/>esquema con Flyway<br/><i>Render / Neon</i>")]
    end

    smtp["Servidor SMTP<br/>(opcional)"]
    wiki["Wikimedia Commons<br/>(fotos de los autos)"]

    cliente -->|HTTPS| spa
    empleado -->|HTTPS| spa
    admin -->|HTTPS| spa
    spa -->|"JSON / HTTPS<br/>token Bearer"| api
    api -->|JDBC| db
    api -.->|recordatorios| smtp
    spa -.->|imágenes| wiki
```

**Lectura.** Los usuarios solo interactúan con el frontend. El frontend no accede a la base: todo pasa
por la API, que valida el token, aplica las reglas de negocio y persiste en PostgreSQL. Las líneas
punteadas son integraciones opcionales: sin SMTP, los recordatorios se escriben en el log; si una foto
de Wikimedia no carga, se muestra una silueta del auto.

## 2. Capas del backend

```mermaid
flowchart LR
    req["Pedido HTTP"] --> filtro["JwtAuthFilter<br/>valida el token"]
    filtro --> ctrl["Controller<br/>@Valid + @PreAuthorize"]
    ctrl --> svc["Service<br/>reglas de negocio<br/>@Transactional"]
    svc --> reglas["service/reglas<br/>CalculadoraHorarios<br/>ReglasTurno"]
    svc --> repo["Repository<br/>Spring Data JPA"]
    repo --> pg[("PostgreSQL")]
    ctrl -. excepción .-> handler["GlobalExceptionHandler<br/>ErrorResponse JSON"]
    svc -. excepción .-> handler
```

## 3. Secuencia: reservar un test drive (incluye el caso de dos clientes a la vez)

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant F as Frontend
    participant A as TestDriveController
    participant S as TestDriveService
    participant DB as PostgreSQL

    C->>F: elige modelo, sucursal y día
    F->>A: GET /api/test-drives/disponibilidad
    A->>S: disponibilidad(modelo, sucursal, fecha)
    S->>DB: unidades demo, vendedores y turnos del día
    DB-->>S: datos
    S-->>F: horarios con lugares = min(unidades libres, vendedores libres)
    C->>F: elige 10:00 y confirma
    F->>A: POST /api/test-drives (Bearer token)
    A->>A: valida JSON (@Valid) y rol CLIENTE (@PreAuthorize)
    A->>S: reservar(pedido, clienteId)
    S->>S: CalculadoraHorarios.validarReserva (no pasado, no domingo, en horario, ≤ 30 días)
    S->>DB: ¿el cliente ya tiene otro turno a esa hora?
    S->>DB: ocupación del día
    S->>S: primera unidad libre + vendedor libre con menos turnos
    S->>DB: INSERT turno (saveAndFlush)
    alt horario todavía libre
        DB-->>S: OK
        S-->>F: 201 Created · turno PENDIENTE con unidad y vendedor
        F-->>C: confirmación
    else otro cliente lo reservó un instante antes
        DB-->>S: violación de uq_turno_vehiculo_horario
        S-->>F: 409 Conflict "Ese horario se acaba de ocupar"
        F->>A: vuelve a pedir la disponibilidad
        F-->>C: mensaje y grilla actualizada
    end
```

**Lectura.** La validación del servicio cubre el caso normal y da mensajes claros (422 si la regla no se
cumple). El caso de dos pedidos simultáneos lo resuelve la base de datos con el índice único parcial:
el segundo INSERT falla y el cliente recibe un 409 en lugar de un turno duplicado (ver ADR-04).

## 4. Secuencia: login y pedido autenticado

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant F as Frontend
    participant AC as AuthController
    participant AS as AuthService
    participant J as JwtService
    participant FL as JwtAuthFilter
    participant DB as PostgreSQL

    U->>F: email y contraseña
    F->>AC: POST /api/auth/login
    AC->>AS: login(req)
    AS->>DB: buscar usuario por email
    AS->>AS: BCrypt.matches(contraseña, hash)
    alt credenciales válidas y cuenta activa
        AS->>J: generarToken(usuario)
        J-->>AS: JWT firmado (id, email, rol, vence en 24 h)
        AS-->>F: 200 { token, usuario }
        F->>F: guarda el token y redirige según el rol
    else credenciales inválidas
        AS-->>F: 401 (mismo mensaje exista o no el email)
    end

    Note over F,DB: En cada pedido siguiente
    F->>FL: GET /api/test-drives/mios · Authorization: Bearer token
    FL->>J: obtenerUsuarioId(token)
    J-->>FL: id (si la firma es válida y no venció)
    FL->>DB: cargar usuario (si fue dado de baja, no se autentica)
    FL->>FL: usuario autenticado con ROLE_CLIENTE
```

## 5. Secuencia: recordatorio automático del día anterior

```mermaid
sequenceDiagram
    autonumber
    participant R as RecordatorioScheduler
    participant DB as PostgreSQL
    participant N as NotificacionService
    participant M as SMTP / log

    loop cada hora en punto (hora de Argentina)
        R->>DB: turnos y clases de mañana PENDIENTES o CONFIRMADOS sin recordatorio
        DB-->>R: lista
        loop por cada turno
            R->>N: enviar(email, asunto, texto)
            N->>M: email (si está habilitado) o línea en el log
            R->>DB: recordatorio_enviado = true
        end
    end
```

## 6. Estados de un turno

```mermaid
stateDiagram-v2
    [*] --> PENDIENTE: el cliente reserva
    PENDIENTE --> CONFIRMADO: el vendedor/instructor confirma
    PENDIENTE --> CANCELADO: cliente o empleado cancela
    CONFIRMADO --> REALIZADO: vino (solo cuando ya empezó)
    CONFIRMADO --> AUSENTE: no vino (solo cuando ya empezó)
    CONFIRMADO --> CANCELADO: cancela antes de empezar
    REALIZADO --> [*]
    AUSENTE --> [*]
    CANCELADO --> [*]
```

Las transiciones están en `EstadoTurno.java` (backend) y se repiten en `AccionesEstado.tsx` (frontend)
para mostrar solo los botones válidos. Un turno `CANCELADO` no ocupa el horario.

## 7. Solicitud de compra ("Quiero comprarlo")

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant F as Frontend (Comprar.tsx)
    participant S as SolicitudCompraService
    participant K as CalculadoraFinanciacion
    participant DB as PostgreSQL
    participant N as NotificacionService

    F->>S: GET /condiciones (tasa, plazos, anticipo mínimo)
    C->>F: elige versión, color, financiado (anticipo y cuotas), usado
    F->>F: simula la cuota en pantalla (utils/financiacion.ts)
    C->>F: Enviar solicitud
    F->>S: POST /api/solicitudes-compra
    S->>DB: ¿ya tiene una abierta de esta versión?
    S->>K: validar(anticipo ≥ 30 %, plazo ofrecido) y simular(cuota)
    S->>DB: vendedor activo de la sucursal con menos solicitudes abiertas
    S->>DB: INSERT (copia precio y cuota) — uq_solicitud_abierta evita duplicados
    S->>N: avisos al cliente y al vendedor
    S-->>F: 201 · solicitud NUEVA
    F-->>C: presupuesto imprimible (/solicitudes/:id)
```

```mermaid
stateDiagram-v2
    [*] --> NUEVA: el cliente envía la solicitud
    NUEVA --> CONTACTADA: el vendedor lo llamó
    CONTACTADA --> RESERVADA: dejó seña
    CONTACTADA --> VENDIDA
    RESERVADA --> VENDIDA
    NUEVA --> DESCARTADA
    CONTACTADA --> DESCARTADA
    RESERVADA --> DESCARTADA
    VENDIDA --> [*]
    DESCARTADA --> [*]
```

El cliente puede desistir ("Ya no me interesa") mientras está NUEVA o CONTACTADA; con la unidad reservada,
tiene que hablar con el vendedor. Las transiciones están en `EstadoSolicitud.java` y se repiten en
`components/AccionesSolicitud.tsx`.

## 8. Modelo de datos

El diagrama entidad-relación completo está en [`esquema_bd_y_modulos.md`](./esquema_bd_y_modulos.md).
