package com.km0automotores.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalTime;

@Entity
@Table(name = "sucursal")
public class Sucursal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "nombre", nullable = false, unique = true, length = 100)
    private String nombre;

    @Column(name = "direccion", nullable = false, length = 150)
    private String direccion;

    @Column(name = "ciudad", nullable = false, length = 80)
    private String ciudad;

    @Column(name = "telefono", length = 30)
    private String telefono;

    /** Lunes a viernes abre a esta hora (los sábados también). */
    @Column(name = "horario_apertura", nullable = false)
    private LocalTime horarioApertura;

    /** Lunes a viernes cierra a esta hora. */
    @Column(name = "horario_cierre", nullable = false)
    private LocalTime horarioCierre;

    /** Hora de cierre de los sábados; null si no abre los sábados. Domingos siempre cerrado. */
    @Column(name = "cierre_sabado")
    private LocalTime cierreSabado;

    protected Sucursal() {
    }

    public Sucursal(String nombre, String direccion, String ciudad,
                    LocalTime horarioApertura, LocalTime horarioCierre) {
        this.nombre = nombre;
        this.direccion = direccion;
        this.ciudad = ciudad;
        this.horarioApertura = horarioApertura;
        this.horarioCierre = horarioCierre;
    }

    public Integer getId() { return id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }
    public String getCiudad() { return ciudad; }
    public void setCiudad(String ciudad) { this.ciudad = ciudad; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public LocalTime getHorarioApertura() { return horarioApertura; }
    public void setHorarioApertura(LocalTime horarioApertura) { this.horarioApertura = horarioApertura; }
    public LocalTime getHorarioCierre() { return horarioCierre; }
    public void setHorarioCierre(LocalTime horarioCierre) { this.horarioCierre = horarioCierre; }
    public LocalTime getCierreSabado() { return cierreSabado; }
    public void setCierreSabado(LocalTime cierreSabado) { this.cierreSabado = cierreSabado; }
}
