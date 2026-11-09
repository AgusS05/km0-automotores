package com.km0automotores.repository;

import com.km0automotores.model.Sucursal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SucursalRepository extends JpaRepository<Sucursal, Integer> {

    List<Sucursal> findAllByOrderByIdAsc();

    boolean existsByNombreIgnoreCase(String nombre);
}
