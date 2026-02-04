# ---------- Build stage ----------
FROM eclipse-temurin:17-jdk AS build
WORKDIR /workspace

# Copy only backend wrapper + pom first (better caching)
COPY chat-backend/.mvn chat-backend/.mvn
COPY chat-backend/mvnw chat-backend/pom.xml chat-backend/
WORKDIR /workspace/chat-backend

RUN chmod +x mvnw && ./mvnw -DskipTests dependency:go-offline

# Now copy backend source
COPY chat-backend/src ./src

# Build jar
RUN ./mvnw -DskipTests clean package

# ---------- Run stage ----------
FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /workspace/chat-backend/target/*.jar app.jar

# Render provides PORT env var
ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar"]
