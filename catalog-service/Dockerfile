FROM maven:3-eclipse-temurin-26 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /app/target/catalog-service-0.0.1-SNAPSHOT.jar app.jar
USER app
EXPOSE 8081
ENV JAVA_OPTS="-Xmx256m -Xms128m"
ENV SPRING_PROFILES_ACTIVE="prod"
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD wget -q --spider http://localhost:8081/api/catalog/products || exit 1
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
