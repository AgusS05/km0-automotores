package com.km0automotores.service;

import com.km0automotores.model.ClaseManejo;
import com.km0automotores.model.EstadoTurno;
import com.km0automotores.model.Modelo;
import com.km0automotores.model.TurnoTestDrive;
import com.km0automotores.repository.ClaseManejoRepository;
import com.km0automotores.repository.TurnoTestDriveRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * Tarea automática: cada hora busca los turnos y clases de MAÑANA que todavía
 * no recibieron recordatorio, avisa al cliente y los marca como avisados
 * (así no se envía dos veces). Reduce las inasistencias.
 */
@Component
public class RecordatorioScheduler {

    private static final Logger log = LoggerFactory.getLogger(RecordatorioScheduler.class);
    private static final List<EstadoTurno> A_RECORDAR = List.of(EstadoTurno.PENDIENTE, EstadoTurno.CONFIRMADO);
    private static final DateTimeFormatter FECHA =
            DateTimeFormatter.ofPattern("EEEE d 'de' MMMM", Locale.forLanguageTag("es-AR"));

    private final TurnoTestDriveRepository turnoRepository;
    private final ClaseManejoRepository claseRepository;
    private final NotificacionService notificaciones;
    private final Clock clock;

    public RecordatorioScheduler(TurnoTestDriveRepository turnoRepository, ClaseManejoRepository claseRepository,
                                 NotificacionService notificaciones, Clock clock) {
        this.turnoRepository = turnoRepository;
        this.claseRepository = claseRepository;
        this.notificaciones = notificaciones;
        this.clock = clock;
    }

    /**
     * Se ejecuta cada hora en punto (hora de Argentina): busca los test drives y clases
     * de mañana que siguen activos y todavía no tienen recordatorio, avisa a cada cliente
     * y los marca como avisados para no repetir el envío.
     */
    @Scheduled(cron = "0 0 * * * *", zone = "${app.zona-horaria}")
    @Transactional
    public void enviarRecordatorios() {
        LocalDate manana = LocalDate.now(clock).plusDays(1);
        int enviados = 0;

        for (TurnoTestDrive t : turnoRepository.findParaRecordar(manana, A_RECORDAR)) {
            Modelo m = t.getVehiculoDemo().getVersion().getModelo();
            String cuerpo = "Hola " + t.getCliente().getNombre() + ", te recordamos tu test drive del "
                    + m.getMarca().getNombre() + " " + m.getNombre() + " mañana " + FECHA.format(t.getFecha())
                    + " a las " + t.getHoraInicio() + " en la sucursal " + t.getVehiculoDemo().getSucursal().getNombre()
                    + " (" + t.getVehiculoDemo().getSucursal().getDireccion() + "). Traé tu licencia de conducir. "
                    + "Si no podés venir, cancelalo desde 'Mis turnos'.";
            if (notificaciones.enviar(t.getCliente().getEmail(), "Recordatorio de tu test drive", cuerpo)) {
                t.setRecordatorioEnviado(true);
                enviados++;
            }
        }

        for (ClaseManejo c : claseRepository.findParaRecordar(manana, A_RECORDAR)) {
            String cuerpo = "Hola " + c.getCliente().getNombre() + ", te recordamos tu clase de manejo de mañana "
                    + FECHA.format(c.getFecha()) + " a las " + c.getHoraInicio() + " con "
                    + c.getInstructor().getNombreCompleto() + " en " + c.getSucursal().getNombre()
                    + " (" + c.getSucursal().getDireccion() + ").";
            if (notificaciones.enviar(c.getCliente().getEmail(), "Recordatorio de tu clase de manejo", cuerpo)) {
                c.setRecordatorioEnviado(true);
                enviados++;
            }
        }

        if (enviados > 0) {
            log.info("Recordatorios enviados para el {}: {}", manana, enviados);
        }
    }
}
