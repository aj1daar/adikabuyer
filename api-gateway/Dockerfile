FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B clean package -DskipTests

FROM eclipse-temurin:25-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /app/target/api-gateway-0.0.1-SNAPSHOT.jar app.jar
USER app
EXPOSE 8080
ENV JAVA_OPTS="-Xmx256m -Xms128m"
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD nc -z localhost 8080 || exit 1
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
