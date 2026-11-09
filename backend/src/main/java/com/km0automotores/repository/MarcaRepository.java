package com.km0automotores.repository;

import com.km0automotores.model.Marca;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarcaRepository extends JpaRepository<Marca, Integer> {

    List<Marca> findAllByOrderByNombreAsc();

    boolean existsByNombreIgnoreCase(String nombre);
}
