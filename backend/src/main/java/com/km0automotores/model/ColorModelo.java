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

@Entity
@Table(name = "color_modelo")
public class ColorModelo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "modelo_id", nullable = false)
    private Modelo modelo;

    @Column(name = "nombre", nullable = false, length = 60)
    private String nombre;

    /** Color en formato #RRGGBB (lo usa el visor 3D para pintar el auto). */
    @Column(name = "hex", nullable = false, length = 7)
    private String hex;

    protected ColorModelo() {
    }

    public ColorModelo(Modelo modelo, String nombre, String hex) {
        this.modelo = modelo;
        this.nombre = nombre;
        this.hex = hex;
    }

    public Integer getId() { return id; }
    public Modelo getModelo() { return modelo; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getHex() { return hex; }
    public void setHex(String hex) { this.hex = hex; }
}
