# ---- Etapa 1: compilar con Maven ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

# ---- Etapa 2: imagen liviana solo con el JRE ----
FROM eclipse-temurin:17-jre
WORKDIR /app
ENV TZ=America/Argentina/Cordoba
COPY --from=build /app/target/km0-automotores-backend.jar app.jar
EXPOSE 8080
# Render y Railway indican el puerto en la variable PORT (application.yml ya la lee)
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
