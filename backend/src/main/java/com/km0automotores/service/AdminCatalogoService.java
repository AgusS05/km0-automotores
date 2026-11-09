package com.km0automotores.service;

import com.km0automotores.dto.admin.ColorRequest;
import com.km0automotores.dto.admin.ImagenRequest;
import com.km0automotores.dto.admin.MarcaRequest;
import com.km0automotores.dto.admin.ModeloRequest;
import com.km0automotores.dto.admin.VersionRequest;
import com.km0automotores.dto.catalogo.ColorDto;
import com.km0automotores.dto.catalogo.ImagenDto;
import com.km0automotores.dto.catalogo.MarcaDto;
import com.km0automotores.dto.catalogo.ModeloDetalleDto;
import com.km0automotores.dto.catalogo.VersionDto;
import com.km0automotores.exception.ConflictoException;
import com.km0automotores.exception.RecursoNoEncontradoException;
import com.km0automotores.mapper.CatalogoMapper;
import com.km0automotores.model.ColorModelo;
import com.km0automotores.model.ImagenModelo;
import com.km0automotores.model.Marca;
import com.km0automotores.model.Modelo;
import com.km0automotores.model.VersionModelo;
import com.km0automotores.repository.ColorModeloRepository;
import com.km0automotores.repository.ImagenModeloRepository;
import com.km0automotores.repository.MarcaRepository;
import com.km0automotores.repository.ModeloRepository;
import com.km0automotores.repository.VehiculoDemoRepository;
import com.km0automotores.repository.VersionModeloRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Alta, baja y modificación del catálogo (solo administradores). */
@Service
@Transactional
public class AdminCatalogoService {

    private final MarcaRepository marcaRepository;
    private final ModeloRepository modeloRepository;
    private final VersionModeloRepository versionRepository;
    private final ImagenModeloRepository imagenRepository;
    private final ColorModeloRepository colorRepository;
    private final VehiculoDemoRepository vehiculoDemoRepository;

    public AdminCatalogoService(MarcaRepository marcaRepository, ModeloRepository modeloRepository,
                                VersionModeloRepository versionRepository, ImagenModeloRepository imagenRepository,
                                ColorModeloRepository colorRepository, VehiculoDemoRepository vehiculoDemoRepository) {
        this.marcaRepository = marcaRepository;
        this.modeloRepository = modeloRepository;
        this.versionRepository = versionRepository;
        this.imagenRepository = imagenRepository;
        this.colorRepository = colorRepository;
        this.vehiculoDemoRepository = vehiculoDemoRepository;
    }

    // ------------------------------------------------------------------ marcas

    /**
     * Crea una marca.
     * @throws ConflictoException si ya existe una marca con ese nombre
     */
    public MarcaDto crearMarca(MarcaRequest req) {
        String nombre = req.nombre().trim();
        if (marcaRepository.existsByNombreIgnoreCase(nombre)) {
            throw new ConflictoException("La marca " + nombre + " ya existe.");
        }
        return CatalogoMapper.toMarcaDto(marcaRepository.save(new Marca(nombre)), 0);
    }

    /**
     * Cambia el nombre de una marca.
     * @throws RecursoNoEncontradoException si la marca no existe
     * @throws ConflictoException si el nombre ya lo usa otra marca
     */
    public MarcaDto editarMarca(Integer id, MarcaRequest req) {
        Marca marca = marca(id);
        marca.setNombre(req.nombre().trim());
        return CatalogoMapper.toMarcaDto(marca, modeloRepository.countByMarcaId(id));
    }

    /**
     * Elimina una marca que no tenga modelos.
     * @throws ConflictoException si la marca todavía tiene modelos cargados
     */
    public void eliminarMarca(Integer id) {
        Marca marca = marca(id);
        if (modeloRepository.countByMarcaId(id) > 0) {
            throw new ConflictoException("La marca tiene modelos cargados. Eliminalos primero.");
        }
        marcaRepository.delete(marca);
    }

    // ------------------------------------------------------------------ modelos

    /**
     * Crea un modelo dentro de una marca.
     * @return la ficha completa del modelo creado
     * @throws ConflictoException si la marca ya tiene un modelo con ese nombre
     */
    public ModeloDetalleDto crearModelo(ModeloRequest req) {
        Marca marca = marca(req.marcaId());
        if (modeloRepository.existeEnMarca(marca.getId(), req.nombre().trim())) {
            throw new ConflictoException(marca.getNombre() + " ya tiene un modelo llamado " + req.nombre().trim() + ".");
        }
        Modelo modelo = new Modelo(marca, req.nombre().trim(), req.tipoCarroceria(), req.anio());
        modelo.setDescripcion(AuthService.textoOpcional(req.descripcion()));
        modelo.setDestacado(req.destacado());
        modeloRepository.save(modelo);
        return detalle(modelo);
    }

    /**
     * Modifica los datos generales de un modelo (nombre, carrocería, año, descripción, destacado).
     * @return la ficha actualizada
     */
    public ModeloDetalleDto editarModelo(Integer id, ModeloRequest req) {
        Modelo modelo = modelo(id);
        modelo.setMarca(marca(req.marcaId()));
        modelo.setNombre(req.nombre().trim());
        modelo.setTipoCarroceria(req.tipoCarroceria());
        modelo.setAnio(req.anio());
        modelo.setDescripcion(AuthService.textoOpcional(req.descripcion()));
        modelo.setDestacado(req.destacado());
        return detalle(modelo);
    }

    /**
     * Elimina un modelo sin versiones; sus fotos y colores se borran en cascada.
     * @throws ConflictoException si el modelo todavía tiene versiones cargadas
     */
    public void eliminarModelo(Integer id) {
        Modelo modelo = modelo(id);
        if (!modelo.getVersiones().isEmpty()) {
            throw new ConflictoException("El modelo tiene versiones cargadas. Eliminalas primero.");
        }
        modeloRepository.delete(modelo); // fotos y colores se borran en cascada
    }

    // ------------------------------------------------------------------ versiones

    /**
     * Agrega una versión (precio y ficha técnica) a un modelo.
     */
    public VersionDto crearVersion(VersionRequest req) {
        Modelo modelo = modelo(req.modeloId());
        VersionModelo v = new VersionModelo(modelo, req.nombreVersion().trim(), req.precio(), req.combustible());
        copiar(req, v);
        versionRepository.save(v);
        modelo.getVersiones().add(v);
        return CatalogoMapper.toVersionDto(v);
    }

    /**
     * Modifica precio y ficha técnica de una versión.
     */
    public VersionDto editarVersion(Integer id, VersionRequest req) {
        VersionModelo v = version(id);
        v.setModelo(modelo(req.modeloId()));
        v.setNombreVersion(req.nombreVersion().trim());
        v.setPrecio(req.precio());
        v.setCombustible(req.combustible());
        copiar(req, v);
        return CatalogoMapper.toVersionDto(v);
    }

    /**
     * Elimina una versión.
     * @throws ConflictoException si tiene unidades demo asociadas
     */
    public void eliminarVersion(Integer id) {
        versionRepository.delete(version(id));
        versionRepository.flush(); // si tiene unidades demo, la FK falla acá → 409
    }

    // ------------------------------------------------------------------ fotos y colores

    /**
     * Agrega una foto a la galería del modelo (si no se indica orden, va al final).
     */
    public ImagenDto agregarImagen(Integer modeloId, ImagenRequest req) {
        Modelo modelo = modelo(modeloId);
        int orden = req.orden() != null ? req.orden() : modelo.getImagenes().size();
        ImagenModelo img = new ImagenModelo(modelo, req.url().trim(), AuthService.textoOpcional(req.fuenteUrl()),
                AuthService.textoOpcional(req.credito()), orden);
        imagenRepository.save(img);
        return CatalogoMapper.toImagenDto(img);
    }

    /**
     * Quita una foto de la galería.
     */
    public void eliminarImagen(Integer imagenId) {
        ImagenModelo img = imagenRepository.findById(imagenId)
                .orElseThrow(() -> new RecursoNoEncontradoException("La imagen", imagenId));
        imagenRepository.delete(img);
    }

    /**
     * Agrega un color de carrocería al modelo (lo usa el visor 3D).
     */
    public ColorDto agregarColor(Integer modeloId, ColorRequest req) {
        ColorModelo color = new ColorModelo(modelo(modeloId), req.nombre().trim(), req.hex().toUpperCase());
        colorRepository.save(color);
        return CatalogoMapper.toColorDto(color);
    }

    /**
     * Quita un color del modelo.
     */
    public void eliminarColor(Integer colorId) {
        ColorModelo color = colorRepository.findById(colorId)
                .orElseThrow(() -> new RecursoNoEncontradoException("El color", colorId));
        colorRepository.delete(color);
    }

    // ------------------------------------------------------------------ auxiliares

    private ModeloDetalleDto detalle(Modelo modelo) {
        return CatalogoMapper.toModeloDetalle(modelo, vehiculoDemoRepository.findSucursalesConDemo(modelo.getId()));
    }

    private static void copiar(VersionRequest req, VersionModelo v) {
        v.setMotor(AuthService.textoOpcional(req.motor()));
        v.setPotenciaCv(req.potenciaCv());
        v.setTransmision(AuthService.textoOpcional(req.transmision()));
        v.setTraccion(AuthService.textoOpcional(req.traccion()));
        v.setPuertas(req.puertas());
        v.setPlazas(req.plazas());
    }

    private Marca marca(Integer id) {
        return marcaRepository.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("La marca", id));
    }

    private Modelo modelo(Integer id) {
        return modeloRepository.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("El modelo", id));
    }

    private VersionModelo version(Integer id) {
        return versionRepository.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("La versión", id));
    }
}
