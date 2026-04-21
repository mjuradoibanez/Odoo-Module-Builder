# Dockerfile para backend Java omb-server
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/omb-server-1.0-SNAPSHOT.jar /app/omb-server.jar
COPY --from=build /app/src/main/java/server/ /app/server/
CMD ["java", "-cp", "/app/omb-server.jar:/app", "server.Server"]
