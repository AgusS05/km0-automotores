package com.km0automotores.repository;

import com.km0automotores.model.Modelo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ModeloRepository extends JpaRepository<Modelo, Integer> {

    /** Trae la marca en la misma consulta; versiones e imágenes se cargan en lotes (batch fetch). */
    @Query("select m from Modelo m join fetch m.marca order by m.marca.nombre, m.nombre")
    List<Modelo> findAllConMarca();

    long countByMarcaId(Integer marcaId);

    @Query("select count(m) > 0 from Modelo m where m.marca.id = :marcaId and lower(m.nombre) = lower(:nombre)")
    boolean existeEnMarca(@Param("marcaId") Integer marcaId, @Param("nombre") String nombre);
}
