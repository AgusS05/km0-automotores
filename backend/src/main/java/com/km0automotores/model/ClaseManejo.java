package com.km0automotores.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "clase_manejo")
public class ClaseManejo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Usuario cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "instructor_id", nullable = false)
    private Usuario instructor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sucursal_id", nullable = false)
    private Sucursal sucursal;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin;

    @Enumerated(EnumType.STRING)
    @Column(name = "transmision", nullable = false, length = 20)
    private Transmision transmision = Transmision.MANUAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoTurno estado = EstadoTurno.PENDIENTE;

    @Column(name = "observaciones", length = 500)
    private String observaciones;

    @Column(name = "recordatorio_enviado", nullable = false)
    private boolean recordatorioEnviado;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    protected ClaseManejo() {
    }

    public ClaseManejo(Usuario cliente, Usuario instructor, Sucursal sucursal, LocalDate fecha,
                       LocalTime horaInicio, LocalTime horaFin, Transmision transmision) {
        this.cliente = cliente;
        this.instructor = instructor;
        this.sucursal = sucursal;
        this.fecha = fecha;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
        this.transmision = transmision;
    }

    @PrePersist
    void alCrear() {
        if (creadoEn == null) {
            creadoEn = LocalDateTime.now();
        }
    }

    public Integer getId() { return id; }
    public Usuario getCliente() { return cliente; }
    public Usuario getInstructor() { return instructor; }
    public Sucursal getSucursal() { return sucursal; }
    public LocalDate getFecha() { return fecha; }
    public LocalTime getHoraInicio() { return horaInicio; }
    public LocalTime getHoraFin() { return horaFin; }
    public Transmision getTransmision() { return transmision; }
    public EstadoTurno getEstado() { return estado; }
    public void setEstado(EstadoTurno estado) { this.estado = estado; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public boolean isRecordatorioEnviado() { return recordatorioEnviado; }
    public void setRecordatorioEnviado(boolean recordatorioEnviado) { this.recordatorioEnviado = recordatorioEnviado; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
}
