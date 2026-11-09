package com.km0automotores.repository;

import com.km0automotores.model.VersionModelo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface VersionModeloRepository extends JpaRepository<VersionModelo, Integer> {

    @Query("select v from VersionModelo v join fetch v.modelo m join fetch m.marca where v.id in :ids")
    List<VersionModelo> findConModeloByIdIn(@Param("ids") Collection<Integer> ids);

    @Query("select v from VersionModelo v join fetch v.modelo m join fetch m.marca order by m.marca.nombre, m.nombre, v.precio")
    List<VersionModelo> findAllConModelo();
}
