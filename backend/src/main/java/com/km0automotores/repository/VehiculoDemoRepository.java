package com.km0automotores.repository;

import com.km0automotores.model.Sucursal;
import com.km0automotores.model.VehiculoDemo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VehiculoDemoRepository extends JpaRepository<VehiculoDemo, Integer> {

    /** Unidades disponibles de un modelo (cualquier versión) en una sucursal. */
    @Query("""
            select v from VehiculoDemo v
            where v.version.modelo.id = :modeloId
              and v.sucursal.id = :sucursalId
              and v.disponible = true
            order by v.id
            """)
    List<VehiculoDemo> findDisponibles(@Param("modeloId") Integer modeloId, @Param("sucursalId") Integer sucursalId);

    /** Sucursales donde hay al menos una unidad disponible de ese modelo. */
    @Query("""
            select distinct v.sucursal from VehiculoDemo v
            where v.version.modelo.id = :modeloId and v.disponible = true
            """)
    List<Sucursal> findSucursalesConDemo(@Param("modeloId") Integer modeloId);

    @Query("""
            select v from VehiculoDemo v
            join fetch v.version ve join fetch ve.modelo m join fetch m.marca join fetch v.sucursal
            order by v.sucursal.id, m.marca.nombre, m.nombre
            """)
    List<VehiculoDemo> findAllCompleto();

    boolean existsByPatenteIgnoreCase(String patente);
}
