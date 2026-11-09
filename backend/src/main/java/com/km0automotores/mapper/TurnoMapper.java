package com.km0automotores.mapper;

import com.km0automotores.dto.clase.ClaseManejoDto;
import com.km0automotores.dto.turno.PersonaDto;
import com.km0automotores.dto.turno.TurnoTestDriveDto;
import com.km0automotores.model.ClaseManejo;
import com.km0automotores.model.Modelo;
import com.km0automotores.model.Sucursal;
import com.km0automotores.model.TurnoTestDrive;
import com.km0automotores.model.Usuario;
import com.km0automotores.model.VehiculoDemo;

public final class TurnoMapper {

    private TurnoMapper() {
    }

    public static PersonaDto toPersona(Usuario u) {
        return new PersonaDto(u.getId(), u.getNombreCompleto(), u.getEmail(), u.getTelefono());
    }

    public static TurnoTestDriveDto toTurnoDto(TurnoTestDrive t) {
        VehiculoDemo v = t.getVehiculoDemo();
        Modelo m = v.getVersion().getModelo();
        Sucursal s = v.getSucursal();
        return new TurnoTestDriveDto(t.getId(), t.getFecha(), t.getHoraInicio(), t.getHoraFin(), t.getEstado(),
                m.getId(), m.getNombre(), m.getMarca().getNombre(), v.getVersion().getNombreVersion(),
                v.getPatente(), s.getId(), s.getNombre(), s.getDireccion(),
                toPersona(t.getCliente()), toPersona(t.getVendedor()), t.getObservaciones(), t.getCreadoEn());
    }

    public static ClaseManejoDto toClaseDto(ClaseManejo c) {
        Sucursal s = c.getSucursal();
        return new ClaseManejoDto(c.getId(), c.getFecha(), c.getHoraInicio(), c.getHoraFin(), c.getEstado(),
                c.getTransmision(), s.getId(), s.getNombre(), s.getDireccion(),
                toPersona(c.getCliente()), toPersona(c.getInstructor()), c.getObservaciones(), c.getCreadoEn());
    }
}
