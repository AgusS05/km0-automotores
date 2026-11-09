package com.km0automotores.service;

import com.km0automotores.dto.admin.VehiculoDemoDto;
import com.km0automotores.dto.admin.VehiculoDemoRequest;
import com.km0automotores.exception.ConflictoException;
import com.km0automotores.exception.RecursoNoEncontradoException;
import com.km0automotores.mapper.CatalogoMapper;
import com.km0automotores.model.VehiculoDemo;
import com.km0automotores.model.VersionModelo;
import com.km0automotores.repository.VehiculoDemoRepository;
import com.km0automotores.repository.VersionModeloRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Unidades demo para test drive (solo administradores). */
@Service
@Transactional
public class VehiculoDemoService {

    private final VehiculoDemoRepository vehiculoRepository;
    private final VersionModeloRepository versionRepository;
    private final SucursalService sucursalService;

    public VehiculoDemoService(VehiculoDemoRepository vehiculoRepository, VersionModeloRepository versionRepository,
                               SucursalService sucursalService) {
        this.vehiculoRepository = vehiculoRepository;
        this.versionRepository = versionRepository;
        this.sucursalService = sucursalService;
    }

    /**
     * Todas las unidades demo con modelo, versión y sucursal.
     */
    @Transactional(readOnly = true)
    public List<VehiculoDemoDto> listar() {
        return vehiculoRepository.findAllCompleto().stream().map(CatalogoMapper::toVehiculoDemoDto).toList();
    }

    /**
     * Da de alta una unidad demo en una sucursal.
     * @throws ConflictoException si la patente ya está registrada
     */
    public VehiculoDemoDto crear(VehiculoDemoRequest req) {
        String patente = normalizarPatente(req.patente());
        if (vehiculoRepository.existsByPatenteIgnoreCase(patente)) {
            throw new ConflictoException("Ya hay una unidad con la patente " + patente + ".");
        }
        VehiculoDemo v = new VehiculoDemo(version(req.versionId()), sucursalService.buscar(req.sucursalId()), patente);
        v.setDisponible(req.disponible());
        return CatalogoMapper.toVehiculoDemoDto(vehiculoRepository.save(v));
    }

    /**
     * Modifica una unidad (sucursal, patente o si está disponible para test drive).
     */
    public VehiculoDemoDto editar(Integer id, VehiculoDemoRequest req) {
        VehiculoDemo v = buscar(id);
        String patente = normalizarPatente(req.patente());
        if (!v.getPatente().equalsIgnoreCase(patente) && vehiculoRepository.existsByPatenteIgnoreCase(patente)) {
            throw new ConflictoException("Ya hay una unidad con la patente " + patente + ".");
        }
        v.setVersion(version(req.versionId()));
        v.setSucursal(sucursalService.buscar(req.sucursalId()));
        v.setPatente(patente);
        v.setDisponible(req.disponible());
        return CatalogoMapper.toVehiculoDemoDto(v);
    }

    /**
     * Elimina una unidad sin turnos. Si ya tuvo turnos, conviene marcarla como no disponible.
     * @throws ConflictoException si tiene turnos registrados
     */
    public void eliminar(Integer id) {
        vehiculoRepository.delete(buscar(id));
        vehiculoRepository.flush();
    }

    private VehiculoDemo buscar(Integer id) {
        return vehiculoRepository.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("La unidad", id));
    }

    private VersionModelo version(Integer id) {
        return versionRepository.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("La versión", id));
    }

    static String normalizarPatente(String patente) {
        return patente.replace(" ", "").toUpperCase();
    }
}
