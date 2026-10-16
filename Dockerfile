# ============================================================
# Dockerfile for Smart Student Expense Splitter
# Multi-stage build for optimal image size and security
# ============================================================

# --- Stage 1: Build Stage ---
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /build

# Copy backend sources and libraries
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Create compilation output directory
RUN mkdir -p out/frontend

# Compile backend Java classes with MySQL JDBC Driver
RUN javac -encoding UTF-8 -d out -cp "backend/lib/mysql-connector-j-8.3.0.jar" backend/src/*.java

# Unpack MySQL JDBC driver classes into the output so everything is self-contained
WORKDIR /build/out
RUN jar xf /build/backend/lib/mysql-connector-j-8.3.0.jar

# Copy frontend static assets into the classes directory so the server can serve from classpath
WORKDIR /build
RUN cp -r frontend/* out/frontend/

# Package executable fat JAR
RUN jar cfe /build/app.jar ExpenseServer -C out .

# --- Stage 2: Minimal Runtime Stage ---
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Install curl for container health check
RUN apk add --no-cache curl

# Copy fat JAR and frontend directory (allows both JAR classpath and live file updates)
COPY --from=builder /build/app.jar ./app.jar
COPY frontend/ ./frontend/

# Run as non-root user for production security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Default application port (overridden by cloud platforms via $PORT)
ENV PORT=3000
EXPOSE 3000

# Health Check for container orchestrators (Docker, Kubernetes, Render, AWS ECS)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Launch standalone server
ENTRYPOINT ["java", "-jar", "app.jar"]
