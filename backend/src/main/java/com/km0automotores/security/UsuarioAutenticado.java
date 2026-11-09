package com.km0automotores.security;

import com.km0automotores.model.Rol;
import com.km0automotores.model.Usuario;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Usuario logueado durante un pedido HTTP. Los controladores lo reciben con
 * {@code @AuthenticationPrincipal UsuarioAutenticado yo}.
 * El rol se expone como "ROLE_ADMIN", "ROLE_CLIENTE", etc., que es lo que
 * esperan hasRole(...) y @PreAuthorize.
 */
public class UsuarioAutenticado implements UserDetails {

    private final Integer id;
    private final String email;
    private final String passwordHash;
    private final Rol rol;
    private final boolean activo;

    public UsuarioAutenticado(Integer id, String email, String passwordHash, Rol rol, boolean activo) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.rol = rol;
        this.activo = activo;
    }

    public static UsuarioAutenticado desde(Usuario u) {
        return new UsuarioAutenticado(u.getId(), u.getEmail(), u.getPasswordHash(), u.getRol(), u.isActivo());
    }

    public Integer getId() { return id; }
    public Rol getRol() { return rol; }
    public boolean esAdmin() { return rol == Rol.ADMIN; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + rol.name()));
    }

    @Override public String getPassword() { return passwordHash; }
    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return activo; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return activo; }
}
