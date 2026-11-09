package com.km0automotores.repository;

import com.km0automotores.model.ClaseManejo;
import com.km0automotores.model.EstadoTurno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;

public interface ClaseManejoRepository extends JpaRepository<ClaseManejo, Integer> {

    /** Ocupación de instructores (clases no canceladas) de un día en una sucursal. */
    @Query("""
            select new com.km0automotores.repository.OcupacionClase(c.horaInicio, c.instructor.id)
            from ClaseManejo c
            where c.fecha = :fecha and c.sucursal.id = :sucursalId and c.estado <> :cancelado
            """)
    List<OcupacionClase> findOcupacionDelDia(@Param("fecha") LocalDate fecha,
                                             @Param("sucursalId") Integer sucursalId,
                                             @Param("cancelado") EstadoTurno cancelado);

    @Query("""
            select count(c) > 0 from ClaseManejo c
            where c.cliente.id = :clienteId and c.fecha = :fecha and c.horaInicio = :hora
              and c.estado <> :cancelado
            """)
    boolean clienteOcupado(@Param("clienteId") Integer clienteId, @Param("fecha") LocalDate fecha,
                           @Param("hora") LocalTime hora, @Param("cancelado") EstadoTurno cancelado);

    @Query("""
            select c from ClaseManejo c
            join fetch c.instructor join fetch c.sucursal join fetch c.cliente
            where c.cliente.id = :clienteId
            order by c.fecha desc, c.horaInicio desc
            """)
    List<ClaseManejo> findDelCliente(@Param("clienteId") Integer clienteId);

    @Query("""
            select c from ClaseManejo c
            join fetch c.instructor i join fetch c.sucursal s join fetch c.cliente
            where c.fecha between :desde and :hasta
              and (:instructorId is null or i.id = :instructorId)
              and (:sucursalId is null or s.id = :sucursalId)
            order by c.fecha, c.horaInicio, s.id
            """)
    List<ClaseManejo> findAgenda(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta,
                                 @Param("instructorId") Integer instructorId,
                                 @Param("sucursalId") Integer sucursalId);

    @Query("""
            select c from ClaseManejo c
            join fetch c.cliente join fetch c.instructor join fetch c.sucursal
            where c.fecha = :fecha and c.recordatorioEnviado = false and c.estado in :estados
            """)
    List<ClaseManejo> findParaRecordar(@Param("fecha") LocalDate fecha,
                                       @Param("estados") Collection<EstadoTurno> estados);

    // ------------------------- Métricas -------------------------

    @Query("""
            select c.estado, count(c) from ClaseManejo c
            where c.fecha between :desde and :hasta
            group by c.estado
            """)
    List<Object[]> contarPorEstado(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);

    @Query("""
            select concat(i.nombre, ' ', i.apellido), count(c) from ClaseManejo c join c.instructor i
            where c.fecha between :desde and :hasta and c.estado <> :cancelado
            group by i.nombre, i.apellido
            order by count(c) desc
            """)
    List<Object[]> contarPorInstructor(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta,
                                       @Param("cancelado") EstadoTurno cancelado);
}
