# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY workspace/jobfinder/package*.json ./
RUN npm ci
COPY workspace/jobfinder ./
RUN npm run build

# Stage 2: Build Spring Boot Backend with React bundle embedded in static resources
FROM maven:3.9-eclipse-temurin-17-alpine AS backend-build
WORKDIR /app/backend
COPY workspace/jobpulse-backend/pom.xml .
RUN mvn dependency:go-offline -B
COPY workspace/jobpulse-backend ./
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static
RUN mvn package -DskipTests -B

# Stage 3: Lightweight Production Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-build /app/backend/target/jobpulse-api-1.0.0.jar app.jar

ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
