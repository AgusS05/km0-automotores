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
import jakarta.persistence.Table;

import java.math.BigDecimal;

/**
 * Versión (trim) de un modelo, con precio y ficha técnica. Ej: "Corolla SEG Hybrid".
 * Se llama VersionModelo en Java para no confundirla con la anotación @Version de JPA;
 * en la base la tabla se llama "version".
 */
@Entity
@Table(name = "version")
public class VersionModelo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "modelo_id", nullable = false)
    private Modelo modelo;

    @Column(name = "nombre_version", nullable = false, length = 100)
    private String nombreVersion;

    @Column(name = "precio", nullable = false, precision = 14, scale = 2)
    private BigDecimal precio;

    @Column(name = "motor", length = 60)
    private String motor;

    @Column(name = "potencia_cv")
    private Integer potenciaCv;

    @Column(name = "transmision", length = 40)
    private String transmision;

    @Enumerated(EnumType.STRING)
    @Column(name = "combustible", nullable = false, length = 20)
    private Combustible combustible;

    @Column(name = "traccion", length = 30)
    private String traccion;

    @Column(name = "puertas")
    private Integer puertas;

    @Column(name = "plazas")
    private Integer plazas;

    protected VersionModelo() {
    }

    public VersionModelo(Modelo modelo, String nombreVersion, BigDecimal precio, Combustible combustible) {
        this.modelo = modelo;
        this.nombreVersion = nombreVersion;
        this.precio = precio;
        this.combustible = combustible;
    }

    public Integer getId() { return id; }
    public Modelo getModelo() { return modelo; }
    public void setModelo(Modelo modelo) { this.modelo = modelo; }
    public String getNombreVersion() { return nombreVersion; }
    public void setNombreVersion(String nombreVersion) { this.nombreVersion = nombreVersion; }
    public BigDecimal getPrecio() { return precio; }
    public void setPrecio(BigDecimal precio) { this.precio = precio; }
    public String getMotor() { return motor; }
    public void setMotor(String motor) { this.motor = motor; }
    public Integer getPotenciaCv() { return potenciaCv; }
    public void setPotenciaCv(Integer potenciaCv) { this.potenciaCv = potenciaCv; }
    public String getTransmision() { return transmision; }
    public void setTransmision(String transmision) { this.transmision = transmision; }
    public Combustible getCombustible() { return combustible; }
    public void setCombustible(Combustible combustible) { this.combustible = combustible; }
    public String getTraccion() { return traccion; }
    public void setTraccion(String traccion) { this.traccion = traccion; }
    public Integer getPuertas() { return puertas; }
    public void setPuertas(Integer puertas) { this.puertas = puertas; }
    public Integer getPlazas() { return plazas; }
    public void setPlazas(Integer plazas) { this.plazas = plazas; }
}
