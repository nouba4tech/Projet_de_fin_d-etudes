# Hugging Face Space (SDK "Docker") : tout Mirador Hotel dans UN conteneur.
#   nginx (web + proxy /api) + MySQL 8 + 11 microservices + gateway.
# Le code est clone depuis GitHub a la construction ; la ligne ADD ci-dessous force un clone a jour a chaque
# "Factory rebuild" du Space (elle change des que la branche main change).

############ 1) sources
FROM alpine:3.20 AS src
RUN apk add --no-cache git
ADD https://api.github.com/repos/nouba4tech/Projet_de_fin_d-etudes/git/refs/heads/main /tmp/version.json
RUN git clone --depth 1 https://github.com/nouba4tech/Projet_de_fin_d-etudes.git /src

############ 2) compilation des 12 modules Java
FROM maven:3.9.6-eclipse-temurin-17 AS jars
COPY --from=src /src/microservices /build
WORKDIR /build
RUN mvn -B -q -DskipTests package \
 && mkdir /out && cp */target/*-service.jar api-gateway/target/api-gateway.jar /out/

############ 3) frontend (l'API est appelee en meme origine : /api)
FROM node:20-alpine AS web
COPY --from=src /src/frontend /web
WORKDIR /web
ENV VITE_API_URL=/api
RUN npm ci --no-audit --no-fund && npm run build

############ 4) image finale
FROM eclipse-temurin:17-jre-jammy
RUN printf '#!/bin/sh\nexit 101\n' > /usr/sbin/policy-rc.d && chmod +x /usr/sbin/policy-rc.d \
 && apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends mysql-server mysql-client nginx curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Hugging Face execute le conteneur avec l'utilisateur 1000
RUN useradd -m -u 1000 user && mkdir -p /app/jars /app/sql /app/web && chown -R 1000:1000 /app
COPY --from=jars /out /app/jars
COPY --from=web /web/dist /app/web
COPY --from=src /src/backend/src/main/resources/schema-mysql.sql /src/backend/src/main/resources/data-seed-clean.sql /src/microservices/migrate-data.sql /src/microservices/sample-data.sql /app/sql/
COPY --from=src /src/deploy/huggingface/start.sh /src/deploy/huggingface/nginx.conf /app/
RUN sed -i 's/\r$//' /app/start.sh /app/nginx.conf && chmod +x /app/start.sh && chown -R 1000:1000 /app

USER user
ENV HOME=/tmp
EXPOSE 7860
CMD ["/app/start.sh"]
