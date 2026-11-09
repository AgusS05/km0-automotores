package com.km0automotores.repository;

import com.km0automotores.model.Rol;
import com.km0automotores.model.Sucursal;
import com.km0automotores.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    /** Vendedores o instructores activos de una sucursal. */
    @Query("select u from Usuario u where u.rol = :rol and u.sucursal.id = :sucursalId and u.activo = true order by u.apellido")
    List<Usuario> findActivosPorRolYSucursal(@Param("rol") Rol rol, @Param("sucursalId") Integer sucursalId);

    /** Sucursales donde trabaja al menos un empleado activo con ese rol (ej. instructores → escuela de manejo). */
    @Query("select distinct u.sucursal from Usuario u where u.rol = :rol and u.activo = true")
    List<Sucursal> findSucursalesConRol(@Param("rol") Rol rol);

    @Query("select u from Usuario u left join fetch u.sucursal where u.rol in :roles order by u.rol, u.apellido")
    List<Usuario> findByRolIn(@Param("roles") Collection<Rol> roles);
}
