package com.km0automotores.repository;

import com.km0automotores.model.EstadoSolicitud;
import com.km0automotores.model.SolicitudCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SolicitudCompraRepository extends JpaRepository<SolicitudCompra, Integer> {

    /** Una solicitud con todo lo que muestra el presupuesto, en una sola consulta. */
    @Query("""
            select s from SolicitudCompra s
            join fetch s.cliente join fetch s.vendedor join fetch s.sucursal
            join fetch s.version v join fetch v.modelo m join fetch m.marca
            where s.id = :id
            """)
    Optional<SolicitudCompra> findDetalle(@Param("id") Integer id);

    @Query("""
            select s from SolicitudCompra s
            join fetch s.cliente join fetch s.vendedor join fetch s.sucursal
            join fetch s.version v join fetch v.modelo m join fetch m.marca
            where s.cliente.id = :clienteId
            order by s.creadoEn desc
            """)
    List<SolicitudCompra> findDelCliente(@Param("clienteId") Integer clienteId);

    /** Listado para vendedores (filtrado por vendedor) y para el admin (todas, con filtros opcionales). */
    @Query("""
            select s from SolicitudCompra s
            join fetch s.cliente join fetch s.vendedor vd join fetch s.sucursal su
            join fetch s.version v join fetch v.modelo m join fetch m.marca
            where (:vendedorId is null or vd.id = :vendedorId)
              and (:sucursalId is null or su.id = :sucursalId)
              and (:estado is null or s.estado = :estado)
            order by s.creadoEn desc
            """)
    List<SolicitudCompra> findListado(@Param("vendedorId") Integer vendedorId,
                                      @Param("sucursalId") Integer sucursalId,
                                      @Param("estado") EstadoSolicitud estado);

    @Query("""
            select count(s) > 0 from SolicitudCompra s
            where s.cliente.id = :clienteId and s.version.id = :versionId and s.estado in :abiertos
            """)
    boolean existeAbierta(@Param("clienteId") Integer clienteId, @Param("versionId") Integer versionId,
                          @Param("abiertos") Collection<EstadoSolicitud> abiertos);

    /** Solicitudes abiertas por vendedor: [vendedorId, cantidad]. Sirve para repartir las nuevas. */
    @Query("""
            select s.vendedor.id, count(s) from SolicitudCompra s
            where s.estado in :abiertos
            group by s.vendedor.id
            """)
    List<Object[]> contarAbiertasPorVendedor(@Param("abiertos") Collection<EstadoSolicitud> abiertos);
}
