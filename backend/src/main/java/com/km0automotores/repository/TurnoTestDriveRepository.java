package com.km0automotores.repository;

import com.km0automotores.model.EstadoTurno;
import com.km0automotores.model.TurnoTestDrive;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;

public interface TurnoTestDriveRepository extends JpaRepository<TurnoTestDrive, Integer> {

    /** Ocupación (no cancelados) de un día en una sucursal: base para calcular disponibilidad. */
    @Query("""
            select new com.km0automotores.repository.OcupacionTestDrive(t.horaInicio, t.vehiculoDemo.id, t.vendedor.id)
            from TurnoTestDrive t
            where t.fecha = :fecha
              and t.vehiculoDemo.sucursal.id = :sucursalId
              and t.estado <> :cancelado
            """)
    List<OcupacionTestDrive> findOcupacionDelDia(@Param("fecha") LocalDate fecha,
                                                 @Param("sucursalId") Integer sucursalId,
                                                 @Param("cancelado") EstadoTurno cancelado);

    @Query("""
            select count(t) > 0 from TurnoTestDrive t
            where t.cliente.id = :clienteId and t.fecha = :fecha and t.horaInicio = :hora
              and t.estado <> :cancelado
            """)
    boolean clienteOcupado(@Param("clienteId") Integer clienteId, @Param("fecha") LocalDate fecha,
                           @Param("hora") LocalTime hora, @Param("cancelado") EstadoTurno cancelado);

    @Query("""
            select t from TurnoTestDrive t
            join fetch t.vehiculoDemo v join fetch v.version ve join fetch ve.modelo m join fetch m.marca
            join fetch v.sucursal join fetch t.vendedor join fetch t.cliente
            where t.cliente.id = :clienteId
            order by t.fecha desc, t.horaInicio desc
            """)
    List<TurnoTestDrive> findDelCliente(@Param("clienteId") Integer clienteId);

    /**
     * Agenda entre dos fechas. Si vendedorId o sucursalId vienen en null, no filtra por ese campo.
     * (Se compara contra un id numérico, por eso el "is null" funciona bien en Postgres.)
     */
    @Query("""
            select t from TurnoTestDrive t
            join fetch t.vehiculoDemo v join fetch v.version ve join fetch ve.modelo m join fetch m.marca
            join fetch v.sucursal s join fetch t.vendedor vd join fetch t.cliente
            where t.fecha between :desde and :hasta
              and (:vendedorId is null or vd.id = :vendedorId)
              and (:sucursalId is null or s.id = :sucursalId)
            order by t.fecha, t.horaInicio, s.id
            """)
    List<TurnoTestDrive> findAgenda(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta,
                                    @Param("vendedorId") Integer vendedorId,
                                    @Param("sucursalId") Integer sucursalId);

    /** Para recordatorios: turnos de un día en ciertos estados que todavía no fueron avisados. */
    @Query("""
            select t from TurnoTestDrive t
            join fetch t.cliente join fetch t.vehiculoDemo v join fetch v.version ve join fetch ve.modelo m
            join fetch m.marca join fetch v.sucursal
            where t.fecha = :fecha and t.recordatorioEnviado = false and t.estado in :estados
            """)
    List<TurnoTestDrive> findParaRecordar(@Param("fecha") LocalDate fecha,
                                          @Param("estados") Collection<EstadoTurno> estados);

    // ------------------------- Métricas -------------------------

    @Query("""
            select t.estado, count(t) from TurnoTestDrive t
            where t.fecha between :desde and :hasta
            group by t.estado
            """)
    List<Object[]> contarPorEstado(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    @Query("""
            select concat(m.marca.nombre, ' ', m.nombre), count(t) from TurnoTestDrive t
            join t.vehiculoDemo v join v.version ve join ve.modelo m
            where t.fecha between :desde and :hasta and t.estado <> :cancelado
            group by m.marca.nombre, m.nombre
            order by count(t) desc
            """)
    List<Object[]> contarPorModelo(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta,
                                   @Param("cancelado") EstadoTurno cancelado);

    @Query("""
            select t.horaInicio, count(t) from TurnoTestDrive t
            where t.fecha between :desde and :hasta and t.estado <> :cancelado
            group by t.horaInicio
            order by t.horaInicio
            """)
    List<Object[]> contarPorHorario(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta,
                                    @Param("cancelado") EstadoTurno cancelado);

    @Query("""
            select v.sucursal.nombre, count(t) from TurnoTestDrive t join t.vehiculoDemo v
            where t.fecha between :desde and :hasta and t.estado <> :cancelado
            group by v.sucursal.nombre
            order by count(t) desc
            """)
    List<Object[]> contarPorSucursal(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta,
                                     @Param("cancelado") EstadoTurno cancelado);

    long countByEstadoAndFechaBetween(EstadoTurno estado, LocalDate desde, LocalDate hasta);
}
