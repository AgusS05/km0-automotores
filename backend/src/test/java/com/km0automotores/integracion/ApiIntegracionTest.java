package com.km0automotores.integracion;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Pruebas de integración: levantan la aplicación completa (seguridad, controladores,
 * servicios, JPA) contra un PostgreSQL 16 real en Docker. Flyway crea el esquema y
 * carga los datos de ejemplo igual que en producción.
 *
 * <p>Requieren Docker en ejecución. Si Docker no está disponible, se omiten
 * (no fallan), y los tests unitarios se siguen ejecutando.</p>
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
class ApiIntegracionTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    /** Corolla en Córdoba Centro: hay una sola unidad demo, sirve para probar "horario lleno". */
    private static final int COROLLA = 1;
    private static final int CORDOBA_CENTRO = 1;
    private static final String CLAVE_DEMO = "Demo1234";

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    // =================================================================== catálogo

    @Nested
    @DisplayName("Catálogo público")
    class Catalogo {

        @Test
        @DisplayName("lista los 21 modelos cargados por Flyway sin necesidad de login")
        void listaModelos() throws Exception {
            mvc.perform(get("/api/modelos"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(21)));
        }

        @Test
        @DisplayName("la ficha de un modelo trae versiones, fotos, colores y sucursales con demo")
        void fichaDeModelo() throws Exception {
            mvc.perform(get("/api/modelos/{id}", COROLLA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.nombre").value("Corolla"))
                    .andExpect(jsonPath("$.versiones", hasSize(greaterThan(0))))
                    .andExpect(jsonPath("$.colores", hasSize(greaterThan(0))))
                    .andExpect(jsonPath("$.sucursalesConDemo", hasSize(greaterThan(0))));
        }

        @Test
        @DisplayName("un modelo inexistente responde 404 con el formato de error de la API")
        void modeloInexistente() throws Exception {
            mvc.perform(get("/api/modelos/{id}", 9999))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.status").value(404))
                    .andExpect(jsonPath("$.mensaje").exists());
        }
    }

    // =================================================================== autenticación

    @Nested
    @DisplayName("Autenticación y permisos")
    class Autenticacion {

        @Test
        @DisplayName("login correcto devuelve un token y /yo identifica al usuario")
        void loginCorrecto() throws Exception {
            String token = login("cliente@example.com", CLAVE_DEMO);

            mvc.perform(get("/api/auth/yo").header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.email").value("cliente@example.com"))
                    .andExpect(jsonPath("$.rol").value("CLIENTE"));
        }

        @Test
        @DisplayName("contraseña incorrecta responde 401")
        void loginIncorrecto() throws Exception {
            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                            .content(json(Map.of("email", "cliente@example.com", "password", "otraClave1"))))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("registrar un email ya usado responde 409")
        void emailRepetido() throws Exception {
            mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                            .content(json(Map.of("nombre", "Otro", "apellido", "Cliente",
                                    "email", "cliente@example.com", "password", CLAVE_DEMO))))
                    .andExpect(status().isConflict());
        }

        @Test
        @DisplayName("datos inválidos en el registro responden 400 con el detalle por campo")
        void registroInvalido() throws Exception {
            mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                            .content(json(Map.of("nombre", "", "apellido", "X", "email", "no-es-email", "password", "123"))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.campos.email").exists())
                    .andExpect(jsonPath("$.campos.password").exists());
        }

        @Test
        @DisplayName("reservar sin token responde 401")
        void sinToken() throws Exception {
            mvc.perform(post("/api/test-drives").contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("un vendedor no puede reservar como cliente (403)")
        void vendedorNoReserva() throws Exception {
            String token = login("martin.ferreyra@km0.com.ar", CLAVE_DEMO);
            mvc.perform(post("/api/test-drives").header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json(reserva(COROLLA, CORDOBA_CENTRO, diaHabil(), "10:00"))))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("solo el administrador ve las métricas")
        void metricasSoloAdmin() throws Exception {
            String admin = login("admin@km0.com.ar", CLAVE_DEMO);
            String cliente = login("cliente@example.com", CLAVE_DEMO);

            mvc.perform(get("/api/admin/metricas").header("Authorization", "Bearer " + admin))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalTestDrives").isNumber());
            mvc.perform(get("/api/admin/metricas").header("Authorization", "Bearer " + cliente))
                    .andExpect(status().isForbidden());
        }
    }

    // =================================================================== reservas

    @Nested
    @DisplayName("Reserva de test drive (flujo completo)")
    class Reservas {

        @Test
        @DisplayName("reservar ocupa el horario, otro cliente recibe 409, y al cancelar se libera")
        void reservarOcuparYCancelar() throws Exception {
            LocalDate dia = diaHabil();
            String hora = primerHorarioLibre(COROLLA, CORDOBA_CENTRO, dia);
            String clienteA = registrarCliente();
            String clienteB = registrarCliente();

            // 1. El cliente A reserva: se le asigna unidad y vendedor
            String respuesta = mvc.perform(post("/api/test-drives").header("Authorization", "Bearer " + clienteA)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json(reserva(COROLLA, CORDOBA_CENTRO, dia, hora))))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.estado").value("PENDIENTE"))
                    .andExpect(jsonPath("$.vendedor.nombre").exists())
                    .andExpect(jsonPath("$.patente").exists())
                    .andReturn().getResponse().getContentAsString();
            Integer turnoId = JsonPath.read(respuesta, "$.id");

            // 2. Con una sola unidad del modelo, el horario deja de estar disponible
            assertThat(lugaresEn(COROLLA, CORDOBA_CENTRO, dia, hora)).isZero();

            // 3. El cliente B intenta el mismo horario: 409
            mvc.perform(post("/api/test-drives").header("Authorization", "Bearer " + clienteB)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json(reserva(COROLLA, CORDOBA_CENTRO, dia, hora))))
                    .andExpect(status().isConflict());

            // 4. El cliente B no puede cancelar el turno de A
            mvc.perform(patch("/api/test-drives/{id}/cancelar", turnoId).header("Authorization", "Bearer " + clienteB))
                    .andExpect(status().isForbidden());

            // 5. A cancela y el horario vuelve a quedar libre
            mvc.perform(patch("/api/test-drives/{id}/cancelar", turnoId).header("Authorization", "Bearer " + clienteA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.estado").value("CANCELADO"));
            assertThat(lugaresEn(COROLLA, CORDOBA_CENTRO, dia, hora)).isEqualTo(1);

            // 6. Ahora B sí puede reservarlo
            mvc.perform(post("/api/test-drives").header("Authorization", "Bearer " + clienteB)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json(reserva(COROLLA, CORDOBA_CENTRO, dia, hora))))
                    .andExpect(status().isCreated());

            mvc.perform(get("/api/test-drives/mios").header("Authorization", "Bearer " + clienteA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].estado").value("CANCELADO"));
        }

        @Test
        @DisplayName("el vendedor ve el turno en su agenda y lo confirma")
        void vendedorConfirma() throws Exception {
            LocalDate dia = diaHabil().plusDays(1);
            while (dia.getDayOfWeek() == DayOfWeek.SATURDAY || dia.getDayOfWeek() == DayOfWeek.SUNDAY) {
                dia = dia.plusDays(1);
            }
            String hora = primerHorarioLibre(COROLLA, CORDOBA_CENTRO, dia);
            String cliente = registrarCliente();

            String respuesta = mvc.perform(post("/api/test-drives").header("Authorization", "Bearer " + cliente)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json(reserva(COROLLA, CORDOBA_CENTRO, dia, hora))))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            Integer turnoId = JsonPath.read(respuesta, "$.id");
            String emailVendedor = jdbc.queryForObject(
                    "SELECT u.email FROM turno_test_drive t JOIN usuario u ON u.id = t.vendedor_id WHERE t.id = ?",
                    String.class, turnoId);

            String vendedor = login(emailVendedor, CLAVE_DEMO);
            String agenda = mvc.perform(get("/api/test-drives/agenda").header("Authorization", "Bearer " + vendedor)
                            .param("desde", dia.toString()).param("hasta", dia.toString()))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            List<Integer> ids = JsonPath.read(agenda, "$[*].id");
            assertThat(ids).contains(turnoId);

            mvc.perform(patch("/api/test-drives/{id}/estado", turnoId).header("Authorization", "Bearer " + vendedor)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json(Map.of("estado", "CONFIRMADO"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.estado").value("CONFIRMADO"));

            // Todavía no empezó: no se puede marcar como realizado (regla de negocio, 422)
            mvc.perform(patch("/api/test-drives/{id}/estado", turnoId).header("Authorization", "Bearer " + vendedor)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json(Map.of("estado", "REALIZADO"))))
                    .andExpect(status().isUnprocessableEntity());
        }

        @Test
        @DisplayName("un domingo no hay horarios y reservar responde 422")
        void domingo() throws Exception {
            LocalDate domingo = hoy().plusDays(1);
            while (domingo.getDayOfWeek() != DayOfWeek.SUNDAY) {
                domingo = domingo.plusDays(1);
            }
            mvc.perform(get("/api/test-drives/disponibilidad")
                            .param("modeloId", String.valueOf(COROLLA))
                            .param("sucursalId", String.valueOf(CORDOBA_CENTRO))
                            .param("fecha", domingo.toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.horarios", hasSize(0)))
                    .andExpect(jsonPath("$.motivo").exists());

            String cliente = registrarCliente();
            mvc.perform(post("/api/test-drives").header("Authorization", "Bearer " + cliente)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json(reserva(COROLLA, CORDOBA_CENTRO, domingo, "10:00"))))
                    .andExpect(status().isUnprocessableEntity());
        }
    }

    // =================================================================== base de datos

    @Nested
    @DisplayName("Restricciones de la base de datos")
    class BaseDeDatos {

        @Test
        @DisplayName("el índice único parcial impide dos turnos activos de la misma unidad a la misma hora")
        void indiceUnicoParcial() {
            LocalDate dia = hoy().plusDays(20);
            Integer cliente = jdbc.queryForObject("SELECT id FROM usuario WHERE email = 'cliente@example.com'", Integer.class);
            Integer vendedor = jdbc.queryForObject("SELECT id FROM usuario WHERE email = 'martin.ferreyra@km0.com.ar'", Integer.class);
            Integer otroVendedor = jdbc.queryForObject("SELECT id FROM usuario WHERE email = 'sofia.rinaldi@km0.com.ar'", Integer.class);
            Integer unidad = jdbc.queryForObject("SELECT MIN(id) FROM vehiculo_demo", Integer.class);
            String insertar = "INSERT INTO turno_test_drive (cliente_id, vehiculo_demo_id, vendedor_id, fecha, hora_inicio, hora_fin) "
                    + "VALUES (?, ?, ?, ?, '07:00', '08:00') RETURNING id";

            Integer primero = jdbc.queryForObject(insertar, Integer.class, cliente, unidad, vendedor, dia);

            // Misma unidad y horario, aunque sea otro vendedor: rechazado por la base
            assertThatThrownBy(() -> jdbc.queryForObject(insertar, Integer.class, cliente, unidad, otroVendedor, dia))
                    .isInstanceOf(DataIntegrityViolationException.class);

            // Un turno cancelado no bloquea el horario
            jdbc.update("UPDATE turno_test_drive SET estado = 'CANCELADO' WHERE id = ?", primero);
            Integer segundo = jdbc.queryForObject(insertar, Integer.class, cliente, unidad, otroVendedor, dia);
            assertThat(segundo).isNotNull();

            jdbc.update("DELETE FROM turno_test_drive WHERE id IN (?, ?)", primero, segundo);
        }

        @Test
        @DisplayName("un vendedor sin sucursal es rechazado por el CHECK de la tabla usuario")
        void vendedorSinSucursal() {
            assertThatThrownBy(() -> jdbc.update(
                    "INSERT INTO usuario (nombre, apellido, email, password_hash, rol) VALUES ('A', 'B', ?, 'x', 'VENDEDOR')",
                    "sin-sucursal-" + UUID.randomUUID() + "@km0.com.ar"))
                    .isInstanceOf(DataIntegrityViolationException.class);
        }
    }

    // =================================================================== solicitudes de compra

    @Nested
    @DisplayName("Solicitudes de compra")
    class SolicitudesCompra {

        /** Corolla Cross XEI Hybrid: $ 49.900.000 en los datos de ejemplo. */
        private static final int COROLLA_CROSS_HYBRID = 5;

        private Map<String, Object> financiado(String anticipo, int cuotas) {
            return Map.of("versionId", COROLLA_CROSS_HYBRID, "sucursalId", CORDOBA_CENTRO, "color", "Gris plata",
                    "formaPago", "FINANCIADO", "anticipo", new java.math.BigDecimal(anticipo), "cuotas", cuotas,
                    "entregaUsado", false);
        }

        @Test
        @DisplayName("las condiciones de financiación son públicas")
        void condicionesPublicas() throws Exception {
            mvc.perform(get("/api/solicitudes-compra/condiciones"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.tnaReferencia").isNumber())
                    .andExpect(jsonPath("$.cuotas", hasSize(greaterThan(0))));
        }

        @Test
        @DisplayName("crear, no duplicar, privacidad y avance del vendedor hasta la venta")
        void flujoCompleto() throws Exception {
            String cliente = registrarCliente();
            String otroCliente = registrarCliente();

            // 1. El cliente pide financiar con 40 % de anticipo: se asigna vendedor y se calcula la cuota
            String respuesta = mvc.perform(post("/api/solicitudes-compra").header("Authorization", "Bearer " + cliente)
                            .contentType(MediaType.APPLICATION_JSON).content(json(financiado("20000000", 36))))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.estado").value("NUEVA"))
                    .andExpect(jsonPath("$.cuotaEstimada").isNumber())
                    .andExpect(jsonPath("$.montoFinanciado").value(29900000.00))
                    .andExpect(jsonPath("$.vendedor.nombreCompleto").exists())
                    .andExpect(jsonPath("$.colorHex").exists())
                    .andReturn().getResponse().getContentAsString();
            Integer id = JsonPath.read(respuesta, "$.id");

            // 2. No puede abrir otra de la misma versión
            mvc.perform(post("/api/solicitudes-compra").header("Authorization", "Bearer " + cliente)
                            .contentType(MediaType.APPLICATION_JSON).content(json(financiado("20000000", 36))))
                    .andExpect(status().isConflict());

            // 3. Otro cliente no puede ver el presupuesto
            mvc.perform(get("/api/solicitudes-compra/{id}", id).header("Authorization", "Bearer " + otroCliente))
                    .andExpect(status().isForbidden());

            // 4. El vendedor asignado la ve en su listado y la avanza
            String emailVendedor = jdbc.queryForObject(
                    "SELECT u.email FROM solicitud_compra s JOIN usuario u ON u.id = s.vendedor_id WHERE s.id = ?",
                    String.class, id);
            String vendedor = login(emailVendedor, CLAVE_DEMO);
            String listado = mvc.perform(get("/api/solicitudes-compra").header("Authorization", "Bearer " + vendedor)
                            .param("estado", "NUEVA"))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            List<Integer> ids = JsonPath.read(listado, "$[*].id");
            assertThat(ids).contains(id);

            // No se puede saltar de NUEVA a VENDIDA
            mvc.perform(patch("/api/solicitudes-compra/{id}/estado", id).header("Authorization", "Bearer " + vendedor)
                            .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("estado", "VENDIDA"))))
                    .andExpect(status().isUnprocessableEntity());
            for (String estado : List.of("CONTACTADA", "RESERVADA")) {
                mvc.perform(patch("/api/solicitudes-compra/{id}/estado", id).header("Authorization", "Bearer " + vendedor)
                                .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("estado", estado))))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.estado").value(estado));
            }

            // 5. Con la unidad reservada, el cliente ya no la cancela desde la web
            mvc.perform(patch("/api/solicitudes-compra/{id}/cancelar", id).header("Authorization", "Bearer " + cliente))
                    .andExpect(status().isUnprocessableEntity());

            // 6. El cliente la ve en "mis solicitudes"
            mvc.perform(get("/api/solicitudes-compra/mias").header("Authorization", "Bearer " + cliente))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].estado").value("RESERVADA"));
        }

        @Test
        @DisplayName("anticipo menor al mínimo, color de otro modelo y usado sin datos responden 422")
        void validaciones() throws Exception {
            String cliente = registrarCliente();
            mvc.perform(post("/api/solicitudes-compra").header("Authorization", "Bearer " + cliente)
                            .contentType(MediaType.APPLICATION_JSON).content(json(financiado("1000000", 36))))
                    .andExpect(status().isUnprocessableEntity());
            mvc.perform(post("/api/solicitudes-compra").header("Authorization", "Bearer " + cliente)
                            .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("versionId", COROLLA_CROSS_HYBRID,
                                    "sucursalId", CORDOBA_CENTRO, "formaPago", "CONTADO", "color", "Amarillo"))))
                    .andExpect(status().isUnprocessableEntity());
            mvc.perform(post("/api/solicitudes-compra").header("Authorization", "Bearer " + cliente)
                            .contentType(MediaType.APPLICATION_JSON).content(json(Map.of("versionId", COROLLA_CROSS_HYBRID,
                                    "sucursalId", CORDOBA_CENTRO, "formaPago", "CONTADO", "entregaUsado", true))))
                    .andExpect(status().isUnprocessableEntity());
        }
    }

    // =================================================================== utilidades

    private String login(String email, String password) throws Exception {
        String respuesta = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(respuesta, "$.token");
    }

    /** Registra un cliente nuevo (email único) y devuelve su token. */
    private String registrarCliente() throws Exception {
        String email = "test-" + UUID.randomUUID() + "@example.com";
        String respuesta = mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("nombre", "Cliente", "apellido", "De Prueba",
                                "email", email, "password", CLAVE_DEMO, "telefono", "351 555-0000"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(respuesta, "$.token");
    }

    private String primerHorarioLibre(int modeloId, int sucursalId, LocalDate dia) throws Exception {
        String respuesta = disponibilidad(modeloId, sucursalId, dia);
        List<String> libres = JsonPath.read(respuesta, "$.horarios[?(@.disponible == true)].hora");
        assertThat(libres).as("debería haber horarios libres el %s", dia).isNotEmpty();
        return libres.get(0).substring(0, 5);
    }

    private int lugaresEn(int modeloId, int sucursalId, LocalDate dia, String hora) throws Exception {
        String respuesta = disponibilidad(modeloId, sucursalId, dia);
        List<Integer> lugares = JsonPath.read(respuesta, "$.horarios[?(@.hora =~ /^" + hora + ".*/)].lugares");
        assertThat(lugares).hasSize(1);
        return lugares.get(0);
    }

    private String disponibilidad(int modeloId, int sucursalId, LocalDate dia) throws Exception {
        return mvc.perform(get("/api/test-drives/disponibilidad")
                        .param("modeloId", String.valueOf(modeloId))
                        .param("sucursalId", String.valueOf(sucursalId))
                        .param("fecha", dia.toString()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
    }

    private static Map<String, Object> reserva(int modeloId, int sucursalId, LocalDate dia, String hora) {
        return Map.of("modeloId", modeloId, "sucursalId", sucursalId, "fecha", dia.toString(), "horaInicio", hora);
    }

    /** Un día de lunes a viernes, una semana adelante (sin turnos de los datos de ejemplo). */
    private static LocalDate diaHabil() {
        LocalDate dia = hoy().plusDays(7);
        while (dia.getDayOfWeek() == DayOfWeek.SATURDAY || dia.getDayOfWeek() == DayOfWeek.SUNDAY) {
            dia = dia.plusDays(1);
        }
        return dia;
    }

    private static LocalDate hoy() {
        return LocalDate.now(ZoneId.of("America/Argentina/Cordoba"));
    }

    private static String json(Map<String, ?> datos) {
        StringBuilder sb = new StringBuilder("{");
        datos.forEach((clave, valor) -> {
            if (sb.length() > 1) sb.append(',');
            sb.append('"').append(clave).append("\":");
            if (valor instanceof Number || valor instanceof Boolean) sb.append(valor);
            else sb.append('"').append(String.valueOf(valor).replace("\"", "\\\"")).append('"');
        });
        return sb.append('}').toString();
    }
}
