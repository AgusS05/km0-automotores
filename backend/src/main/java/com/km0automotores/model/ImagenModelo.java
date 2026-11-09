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
@Table(name = "imagen_modelo")
public class ImagenModelo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "modelo_id", nullable = false)
    private Modelo modelo;

    @Column(name = "url", nullable = false, length = 500)
    private String url;

    /** Página de origen de la foto (en Wikimedia Commons figuran autor y licencia). */
    @Column(name = "fuente_url", length = 500)
    private String fuenteUrl;

    @Column(name = "credito", length = 200)
    private String credito;

    @Column(name = "orden", nullable = false)
    private Integer orden;

    protected ImagenModelo() {
    }

    public ImagenModelo(Modelo modelo, String url, String fuenteUrl, String credito, Integer orden) {
        this.modelo = modelo;
        this.url = url;
        this.fuenteUrl = fuenteUrl;
        this.credito = credito;
        this.orden = orden;
    }

    public Integer getId() { return id; }
    public Modelo getModelo() { return modelo; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getFuenteUrl() { return fuenteUrl; }
    public void setFuenteUrl(String fuenteUrl) { this.fuenteUrl = fuenteUrl; }
    public String getCredito() { return credito; }
    public void setCredito(String credito) { this.credito = credito; }
    public Integer getOrden() { return orden; }
    public void setOrden(Integer orden) { this.orden = orden; }
}
