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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Interés de compra de un cliente sobre una versión. Guarda una copia del precio y de las
 * condiciones de financiación del momento, para que el presupuesto no cambie si después
 * se actualiza la lista de precios.
 */
@Entity
@Table(name = "solicitud_compra")
public class SolicitudCompra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Usuario cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "version_id", nullable = false)
    private VersionModelo version;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sucursal_id", nullable = false)
    private Sucursal sucursal;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vendedor_id", nullable = false)
    private Usuario vendedor;

    @Column(name = "color", length = 60)
    private String color;

    @Enumerated(EnumType.STRING)
    @Column(name = "forma_pago", nullable = false, length = 20)
    private FormaPago formaPago;

    @Column(name = "precio_lista", nullable = false, precision = 14, scale = 2)
    private BigDecimal precioLista;

    @Column(name = "anticipo", precision = 14, scale = 2)
    private BigDecimal anticipo;

    @Column(name = "cuotas")
    private Integer cuotas;

    @Column(name = "tna_referencia", precision = 5, scale = 2)
    private BigDecimal tnaReferencia;

    @Column(name = "cuota_estimada", precision = 14, scale = 2)
    private BigDecimal cuotaEstimada;

    @Column(name = "entrega_usado", nullable = false)
    private boolean entregaUsado;

    @Column(name = "usado_descripcion", length = 200)
    private String usadoDescripcion;

    @Column(name = "comentario", length = 500)
    private String comentario;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoSolicitud estado = EstadoSolicitud.NUEVA;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn;

    protected SolicitudCompra() {
    }

    public SolicitudCompra(Usuario cliente, VersionModelo version, Sucursal sucursal, Usuario vendedor,
                           FormaPago formaPago, BigDecimal precioLista) {
        this.cliente = cliente;
        this.version = version;
        this.sucursal = sucursal;
        this.vendedor = vendedor;
        this.formaPago = formaPago;
        this.precioLista = precioLista;
    }

    @PrePersist
    void alCrear() {
        LocalDateTime ahora = LocalDateTime.now();
        if (creadoEn == null) {
            creadoEn = ahora;
        }
        actualizadoEn = ahora;
    }

    @PreUpdate
    void alModificar() {
        actualizadoEn = LocalDateTime.now();
    }

    /** Guarda la simulación del crédito (solo para FINANCIADO). */
    public void setFinanciacion(BigDecimal anticipo, Integer cuotas, BigDecimal tnaReferencia, BigDecimal cuotaEstimada) {
        this.anticipo = anticipo;
        this.cuotas = cuotas;
        this.tnaReferencia = tnaReferencia;
        this.cuotaEstimada = cuotaEstimada;
    }

    public Integer getId() { return id; }
    public Usuario getCliente() { return cliente; }
    public VersionModelo getVersion() { return version; }
    public Sucursal getSucursal() { return sucursal; }
    public Usuario getVendedor() { return vendedor; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public FormaPago getFormaPago() { return formaPago; }
    public BigDecimal getPrecioLista() { return precioLista; }
    public BigDecimal getAnticipo() { return anticipo; }
    public Integer getCuotas() { return cuotas; }
    public BigDecimal getTnaReferencia() { return tnaReferencia; }
    public BigDecimal getCuotaEstimada() { return cuotaEstimada; }
    public boolean isEntregaUsado() { return entregaUsado; }
    public String getUsadoDescripcion() { return usadoDescripcion; }
    public void setUsado(boolean entregaUsado, String usadoDescripcion) {
        this.entregaUsado = entregaUsado;
        this.usadoDescripcion = entregaUsado ? usadoDescripcion : null;
    }
    public String getComentario() { return comentario; }
    public void setComentario(String comentario) { this.comentario = comentario; }
    public EstadoSolicitud getEstado() { return estado; }
    public void setEstado(EstadoSolicitud estado) { this.estado = estado; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
    public LocalDateTime getActualizadoEn() { return actualizadoEn; }
}
