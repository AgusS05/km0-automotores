package com.km0automotores.model;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "modelo")
public class Modelo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "marca_id", nullable = false)
    private Marca marca;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_carroceria", nullable = false, length = 20)
    private TipoCarroceria tipoCarroceria;

    @Column(name = "anio", nullable = false)
    private Integer anio;

    @Column(name = "descripcion", length = 1000)
    private String descripcion;

    @Column(name = "destacado", nullable = false)
    private boolean destacado;

    /** Las versiones se administran por separado (tienen unidades demo asociadas). */
    @OneToMany(mappedBy = "modelo")
    @OrderBy("precio ASC")
    private List<VersionModelo> versiones = new ArrayList<>();

    /** Fotos y colores "pertenecen" al modelo: si se borra el modelo, se borran. */
    @OneToMany(mappedBy = "modelo", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orden ASC")
    private List<ImagenModelo> imagenes = new ArrayList<>();

    @OneToMany(mappedBy = "modelo", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<ColorModelo> colores = new ArrayList<>();

    protected Modelo() {
    }

    public Modelo(Marca marca, String nombre, TipoCarroceria tipoCarroceria, Integer anio) {
        this.marca = marca;
        this.nombre = nombre;
        this.tipoCarroceria = tipoCarroceria;
        this.anio = anio;
    }

    public Integer getId() { return id; }
    public Marca getMarca() { return marca; }
    public void setMarca(Marca marca) { this.marca = marca; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public TipoCarroceria getTipoCarroceria() { return tipoCarroceria; }
    public void setTipoCarroceria(TipoCarroceria tipoCarroceria) { this.tipoCarroceria = tipoCarroceria; }
    public Integer getAnio() { return anio; }
    public void setAnio(Integer anio) { this.anio = anio; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public boolean isDestacado() { return destacado; }
    public void setDestacado(boolean destacado) { this.destacado = destacado; }
    public List<VersionModelo> getVersiones() { return versiones; }
    public List<ImagenModelo> getImagenes() { return imagenes; }
    public List<ColorModelo> getColores() { return colores; }
}
