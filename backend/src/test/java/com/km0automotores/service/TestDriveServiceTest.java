package com.km0automotores.service;

import com.km0automotores.config.AppProperties;
import com.km0automotores.dto.turno.DisponibilidadDto;
import com.km0automotores.dto.turno.HorarioDto;
import com.km0automotores.dto.turno.ReservaTestDriveRequest;
import com.km0automotores.dto.turno.TurnoTestDriveDto;
import com.km0automotores.exception.ConflictoException;
import com.km0automotores.exception.ReglaNegocioException;
import com.km0automotores.model.Combustible;
import com.km0automotores.model.EstadoTurno;
import com.km0automotores.model.Marca;
import com.km0automotores.model.Modelo;
import com.km0automotores.model.Rol;
import com.km0automotores.model.Sucursal;
import com.km0automotores.model.TipoCarroceria;
import com.km0automotores.model.TurnoTestDrive;
import com.km0automotores.model.Usuario;
import com.km0automotores.model.VehiculoDemo;
import com.km0automotores.model.VersionModelo;
import com.km0automotores.repository.ClaseManejoRepository;
import com.km0automotores.repository.ModeloRepository;
import com.km0automotores.repository.OcupacionTestDrive;
import com.km0automotores.repository.TurnoTestDriveRepository;
import com.km0automotores.repository.UsuarioRepository;
import com.km0automotores.repository.VehiculoDemoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Prueba la lógica de reserva sin base de datos: los repositorios se reemplazan
 * por "mocks" que devuelven datos armados en cada test.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TestDriveServiceTest {

    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Cordoba");
    // "Ahora" fijo: domingo 1/11/2026 a las 10:00. El lunes 2/11 es día hábil.
    private static final Clock RELOJ = Clock.fixed(
            LocalDate.of(2026, 11, 1).atTime(10, 0).atZone(ZONA).toInstant(), ZONA);
    private static final LocalDate LUNES = LocalDate.of(2026, 11, 2);
    private static final LocalTime DIEZ = LocalTime.of(10, 0);

    @Mock TurnoTestDriveRepository turnoRepository;
    @Mock ClaseManejoRepository claseRepository;
    @Mock VehiculoDemoRepository vehiculoRepository;
    @Mock UsuarioRepository usuarioRepository;
    @Mock ModeloRepository modeloRepository;
    @Mock SucursalService sucursalService;

    private TestDriveService service;
    private Sucursal sucursal;
    private Usuario cliente;
    private Usuario vendedorA;
    private Usuario vendedorB;
    private VehiculoDemo unidad1;
    private VehiculoDemo unidad2;

    @BeforeEach
    void preparar() throws Exception {
        AppProperties props = new AppProperties("America/Argentina/Cordoba",
                new AppProperties.Cors(List.of("http://localhost:5173")),
                new AppProperties.Jwt("x".repeat(40), 24),
                new AppProperties.Turnos(60, 60, 30),
                new AppProperties.Notificaciones(false, "test@km0.com.ar"));
        service = new TestDriveService(turnoRepository, claseRepository, vehiculoRepository, usuarioRepository,
                modeloRepository, sucursalService, props, RELOJ);

        sucursal = conId(new Sucursal("Centro", "Av. Colón 1250", "Córdoba", LocalTime.of(9, 0), LocalTime.of(18, 0)), 1);
        Marca marca = conId(new Marca("Toyota"), 1);
        Modelo modelo = conId(new Modelo(marca, "Corolla Cross", TipoCarroceria.SUV, 2026), 7);
        VersionModelo version = conId(new VersionModelo(modelo, "XLI", new BigDecimal("41500000"), Combustible.NAFTA), 3);
        unidad1 = conId(new VehiculoDemo(version, sucursal, "AF100AA"), 10);
        unidad2 = conId(new VehiculoDemo(version, sucursal, "AF200BB"), 11);
        cliente = conId(new Usuario("Juan", "Pérez", "cliente@example.com", "hash", Rol.CLIENTE), 50);
        vendedorA = conId(new Usuario("Martín", "Ferreyra", "a@km0.com.ar", "hash", Rol.VENDEDOR), 2);
        vendedorB = conId(new Usuario("Sofía", "Rinaldi", "b@km0.com.ar", "hash", Rol.VENDEDOR), 3);

        when(modeloRepository.existsById(7)).thenReturn(true);
        when(sucursalService.buscar(1)).thenReturn(sucursal);
        when(usuarioRepository.findById(50)).thenReturn(Optional.of(cliente));
        when(vehiculoRepository.findDisponibles(7, 1)).thenReturn(List.of(unidad1, unidad2));
        when(usuarioRepository.findActivosPorRolYSucursal(Rol.VENDEDOR, 1)).thenReturn(List.of(vendedorA, vendedorB));
        when(turnoRepository.saveAndFlush(any(TurnoTestDrive.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("Asigna la primera unidad libre y el vendedor con menos turnos ese día")
    void asignaVendedorMenosOcupado() {
        // A las 10 están todos libres, pero el vendedor A ya tiene dos turnos más tarde
        when(turnoRepository.findOcupacionDelDia(LUNES, 1, EstadoTurno.CANCELADO)).thenReturn(List.of(
                new OcupacionTestDrive(LocalTime.of(11, 0), 10, 2),
                new OcupacionTestDrive(LocalTime.of(12, 0), 10, 2)));

        TurnoTestDriveDto turno = service.reservar(new ReservaTestDriveRequest(7, 1, LUNES, DIEZ, "  "), 50);

        assertEquals("AF100AA", turno.patente());
        assertEquals("Sofía Rinaldi", turno.vendedor().nombreCompleto());
        assertEquals(LocalTime.of(11, 0), turno.horaFin());
        assertEquals(EstadoTurno.PENDIENTE, turno.estado());
        assertEquals(null, turno.observaciones()); // texto en blanco se guarda como null
    }

    @Test
    @DisplayName("Si la primera unidad está ocupada, usa la siguiente y un vendedor libre")
    void usaUnidadYVendedorLibres() {
        when(turnoRepository.findOcupacionDelDia(LUNES, 1, EstadoTurno.CANCELADO)).thenReturn(List.of(
                new OcupacionTestDrive(DIEZ, 10, 3)));

        TurnoTestDriveDto turno = service.reservar(new ReservaTestDriveRequest(7, 1, LUNES, DIEZ, null), 50);

        assertEquals("AF200BB", turno.patente());
        assertEquals("Martín Ferreyra", turno.vendedor().nombreCompleto());
    }

    @Test
    @DisplayName("Si todas las unidades están ocupadas en ese horario, responde conflicto")
    void sinUnidadesLibres() {
        when(turnoRepository.findOcupacionDelDia(LUNES, 1, EstadoTurno.CANCELADO)).thenReturn(List.of(
                new OcupacionTestDrive(DIEZ, 10, 2),
                new OcupacionTestDrive(DIEZ, 11, 3)));

        assertThrows(ConflictoException.class,
                () -> service.reservar(new ReservaTestDriveRequest(7, 1, LUNES, DIEZ, null), 50));
        verify(turnoRepository, never()).saveAndFlush(any(TurnoTestDrive.class));
    }

    @Test
    @DisplayName("No deja reservar si el cliente ya tiene otro turno a esa hora")
    void clienteOcupado() {
        when(turnoRepository.clienteOcupado(eq(50), eq(LUNES), eq(DIEZ), eq(EstadoTurno.CANCELADO))).thenReturn(true);

        assertThrows(ReglaNegocioException.class,
                () -> service.reservar(new ReservaTestDriveRequest(7, 1, LUNES, DIEZ, null), 50));
    }

    @Test
    @DisplayName("No deja reservar un domingo")
    void domingo() {
        LocalDate domingo = LUNES.plusDays(6);
        assertThrows(ReglaNegocioException.class,
                () -> service.reservar(new ReservaTestDriveRequest(7, 1, domingo, DIEZ, null), 50));
    }

    @Test
    @DisplayName("La disponibilidad descuenta los horarios ocupados")
    void disponibilidad() {
        when(turnoRepository.findOcupacionDelDia(LUNES, 1, EstadoTurno.CANCELADO)).thenReturn(List.of(
                new OcupacionTestDrive(DIEZ, 10, 2),
                new OcupacionTestDrive(DIEZ, 11, 3)));

        DisponibilidadDto dia = service.disponibilidad(7, 1, LUNES);

        assertEquals(9, dia.horarios().size()); // 9 a 18, bloques de 1 hora
        HorarioDto nueve = dia.horarios().get(0);
        HorarioDto diez = dia.horarios().get(1);
        assertTrue(nueve.disponible());
        assertEquals(2, nueve.lugares());
        assertFalse(diez.disponible());
    }

    /** Las entidades no tienen setId (lo genera la base); en los tests se asigna por reflexión. */
    private static <T> T conId(T entidad, Integer id) throws Exception {
        Field campo = entidad.getClass().getDeclaredField("id");
        campo.setAccessible(true);
        campo.set(entidad, id);
        return entidad;
    }
}
