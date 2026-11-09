package com.km0automotores.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/**
 * Documentación de la API en /swagger-ui.html.
 * El botón "Authorize" permite pegar el token JWT que devuelve /api/auth/login.
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(title = "Km0 Automotores API", version = "1.0",
                description = "Catálogo multimarca, reservas de test drive y escuela de manejo."),
        security = @SecurityRequirement(name = "bearerAuth"))
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT")
public class OpenApiConfig {
}
