package com.km0automotores.service;

import com.km0automotores.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Envía avisos por email. Si no hay servidor SMTP configurado (o
 * MAIL_ENABLED=false), el mensaje se escribe en el log: así la aplicación
 * funciona igual en desarrollo y en una demo sin cuenta de correo.
 *
 * Para activarlo: MAIL_ENABLED=true y SPRING_MAIL_HOST, SPRING_MAIL_PORT,
 * SPRING_MAIL_USERNAME, SPRING_MAIL_PASSWORD (ej. una cuenta de Gmail con
 * "contraseña de aplicación").
 */
@Service
public class NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(NotificacionService.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final AppProperties.Notificaciones config;

    public NotificacionService(ObjectProvider<JavaMailSender> mailSender, AppProperties props) {
        this.mailSender = mailSender;
        this.config = props.notificaciones();
    }

    /**
     * Envía un aviso al cliente.
     *
     * <p>Si {@code app.notificaciones.email-habilitado} es false o no hay servidor SMTP
     * configurado, el mensaje se escribe en el log en lugar de enviarse.</p>
     *
     * @param destinatario email del cliente
     * @param asunto       asunto del mensaje
     * @param cuerpo       texto del mensaje
     * @return true si se envió (o se registró en el log) sin errores
     */
    public boolean enviar(String destinatario, String asunto, String cuerpo) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (!config.emailHabilitado() || sender == null) {
            log.info("[Aviso por email simulado] Para: {} | Asunto: {} | {}", destinatario, asunto, cuerpo);
            return true;
        }
        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setFrom(config.remitente());
            mensaje.setTo(destinatario);
            mensaje.setSubject(asunto);
            mensaje.setText(cuerpo);
            sender.send(mensaje);
            return true;
        } catch (MailException e) {
            log.warn("No se pudo enviar el email a {}: {}", destinatario, e.getMessage());
            return false;
        }
    }
}
