FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -B -ntp dependency:go-offline
COPY src ./src
RUN mvn -B -ntp package

FROM eclipse-temurin:21-jre-jammy
RUN groupadd --system qamqor && useradd --system --gid qamqor qamqor
WORKDIR /app
RUN mkdir -p /app/data && chown -R qamqor:qamqor /app
COPY --from=build /build/target/qamqor-api-1.0.0.jar app.jar
USER qamqor
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
