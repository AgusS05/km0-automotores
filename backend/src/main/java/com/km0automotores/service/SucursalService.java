package com.km0automotores.service;

import com.km0automotores.dto.admin.SucursalRequest;
import com.km0automotores.dto.sucursal.SucursalDto;
import com.km0automotores.exception.ConflictoException;
import com.km0automotores.exception.RecursoNoEncontradoException;
import com.km0automotores.exception.ReglaNegocioException;
import com.km0automotores.mapper.CatalogoMapper;
import com.km0automotores.model.Sucursal;
import com.km0automotores.repository.SucursalRepository;
import com.km0automotores.service.reglas.HorarioAtencion;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SucursalService {

    private final SucursalRepository sucursalRepository;

    public SucursalService(SucursalRepository sucursalRepository) {
        this.sucursalRepository = sucursalRepository;
    }

    /**
     * Todas las sucursales, ordenadas por nombre.
     */
    @Transactional(readOnly = true)
    public List<SucursalDto> listar() {
        return sucursalRepository.findAllByOrderByIdAsc().stream().map(CatalogoMapper::toSucursalDto).toList();
    }

    /**
     * Busca una sucursal por id.
     * @throws RecursoNoEncontradoException si no existe
     */
    @Transactional(readOnly = true)
    public Sucursal buscar(Integer id) {
        return sucursalRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("La sucursal", id));
    }

    /**
     * Crea una sucursal con su horario de atención.
     * @throws ConflictoException    si ya existe una sucursal con ese nombre
     * @throws ReglaNegocioException si el horario de cierre no es posterior al de apertura
     */
    @Transactional
    public SucursalDto crear(SucursalRequest req) {
        if (sucursalRepository.existsByNombreIgnoreCase(req.nombre().trim())) {
            throw new ConflictoException("Ya existe una sucursal con ese nombre.");
        }
        validarHorarios(req);
        Sucursal s = new Sucursal(req.nombre().trim(), req.direccion().trim(), req.ciudad().trim(),
                req.horarioApertura(), req.horarioCierre());
        s.setTelefono(AuthService.textoOpcional(req.telefono()));
        s.setCierreSabado(req.cierreSabado());
        return CatalogoMapper.toSucursalDto(sucursalRepository.save(s));
    }

    /**
     * Modifica datos y horario de atención de una sucursal.
     * Los turnos ya reservados no se modifican.
     */
    @Transactional
    public SucursalDto editar(Integer id, SucursalRequest req) {
        Sucursal s = buscar(id);
        validarHorarios(req);
        s.setNombre(req.nombre().trim());
        s.setDireccion(req.direccion().trim());
        s.setCiudad(req.ciudad().trim());
        s.setTelefono(AuthService.textoOpcional(req.telefono()));
        s.setHorarioApertura(req.horarioApertura());
        s.setHorarioCierre(req.horarioCierre());
        s.setCierreSabado(req.cierreSabado());
        return CatalogoMapper.toSucursalDto(s);
    }

    /**
     * Elimina una sucursal sin empleados, unidades ni turnos.
     * @throws ConflictoException si tiene datos relacionados
     */
    @Transactional
    public void eliminar(Integer id) {
        sucursalRepository.delete(buscar(id));
        sucursalRepository.flush(); // si tiene empleados o unidades, la FK falla acá → 409
    }

    /**
     * Convierte el horario de la entidad al objeto que usan las reglas de turnos.
     */
    public static HorarioAtencion horarioDe(Sucursal s) {
        return new HorarioAtencion(s.getHorarioApertura(), s.getHorarioCierre(), s.getCierreSabado());
    }

    private static void validarHorarios(SucursalRequest req) {
        if (!req.horarioCierre().isAfter(req.horarioApertura())) {
            throw new ReglaNegocioException("El horario de cierre debe ser posterior al de apertura.");
        }
        if (req.cierreSabado() != null && !req.cierreSabado().isAfter(req.horarioApertura())) {
            throw new ReglaNegocioException("El cierre de los sábados debe ser posterior a la apertura.");
        }
    }
}
