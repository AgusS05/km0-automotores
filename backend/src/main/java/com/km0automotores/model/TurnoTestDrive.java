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
@Table(name = "turno_test_drive")
public class TurnoTestDrive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Usuario cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehiculo_demo_id", nullable = false)
    private VehiculoDemo vehiculoDemo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vendedor_id", nullable = false)
    private Usuario vendedor;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "hora_inicio", nullable = false)
    private LocalTime horaInicio;

    @Column(name = "hora_fin", nullable = false)
    private LocalTime horaFin;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoTurno estado = EstadoTurno.PENDIENTE;

    @Column(name = "observaciones", length = 500)
    private String observaciones;

    @Column(name = "recordatorio_enviado", nullable = false)
    private boolean recordatorioEnviado;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    protected TurnoTestDrive() {
    }

    public TurnoTestDrive(Usuario cliente, VehiculoDemo vehiculoDemo, Usuario vendedor,
                          LocalDate fecha, LocalTime horaInicio, LocalTime horaFin) {
        this.cliente = cliente;
        this.vehiculoDemo = vehiculoDemo;
        this.vendedor = vendedor;
        this.fecha = fecha;
        this.horaInicio = horaInicio;
        this.horaFin = horaFin;
    }

    @PrePersist
    void alCrear() {
        if (creadoEn == null) {
            creadoEn = LocalDateTime.now();
        }
    }

    public Integer getId() { return id; }
    public Usuario getCliente() { return cliente; }
    public VehiculoDemo getVehiculoDemo() { return vehiculoDemo; }
    public Usuario getVendedor() { return vendedor; }
    public LocalDate getFecha() { return fecha; }
    public LocalTime getHoraInicio() { return horaInicio; }
    public LocalTime getHoraFin() { return horaFin; }
    public EstadoTurno getEstado() { return estado; }
    public void setEstado(EstadoTurno estado) { this.estado = estado; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public boolean isRecordatorioEnviado() { return recordatorioEnviado; }
    public void setRecordatorioEnviado(boolean recordatorioEnviado) { this.recordatorioEnviado = recordatorioEnviado; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
}
