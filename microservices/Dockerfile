# Generic image for any module:  docker build --build-arg MODULE=hotel-service -t mirador/hotel-service .
FROM maven:3.9.6-eclipse-temurin-17 AS build
ARG MODULE
WORKDIR /workspace
COPY . .
RUN mvn -B -q -pl ${MODULE} -am -DskipTests package

FROM eclipse-temurin:17-jre
ARG MODULE
WORKDIR /app
COPY --from=build /workspace/${MODULE}/target/${MODULE}.jar /app/app.jar
ENV JAVA_OPTS="-Xms64m -Xmx256m -XX:+UseSerialGC"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
