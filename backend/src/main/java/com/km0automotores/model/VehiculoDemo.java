package com.km0automotores.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** Unidad física de una versión que está en una sucursal para hacer test drives. */
@Entity
@Table(name = "vehiculo_demo")
public class VehiculoDemo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "version_id", nullable = false)
    private VersionModelo version;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sucursal_id", nullable = false)
    private Sucursal sucursal;

    @Column(name = "patente", nullable = false, unique = true, length = 10)
    private String patente;

    /** Si es false (ej. en el taller) no se ofrece para nuevos test drives. */
    @Column(name = "disponible", nullable = false)
    private boolean disponible = true;

    protected VehiculoDemo() {
    }

    public VehiculoDemo(VersionModelo version, Sucursal sucursal, String patente) {
        this.version = version;
        this.sucursal = sucursal;
        this.patente = patente;
    }

    public Integer getId() { return id; }
    public VersionModelo getVersion() { return version; }
    public void setVersion(VersionModelo version) { this.version = version; }
    public Sucursal getSucursal() { return sucursal; }
    public void setSucursal(Sucursal sucursal) { this.sucursal = sucursal; }
    public String getPatente() { return patente; }
    public void setPatente(String patente) { this.patente = patente; }
    public boolean isDisponible() { return disponible; }
    public void setDisponible(boolean disponible) { this.disponible = disponible; }
}
