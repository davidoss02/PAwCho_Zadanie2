# syntax=docker/dockerfile:1.4
# Autor: Dawid Dziura

#Builder

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

#Finalny obraz

FROM node:20-alpine AS final

#Etykiety
LABEL org.opencontainers.image.authors="Dawid Dziura"
LABEL org.opencontainers.image.title="Weather App (Node.js)"
LABEL org.opencontainers.image.description="Aplikacja pogodowa - Express + Open-Meteo"
LABEL org.opencontainers.image.version="1.0.0"

#Zmienne środowiskowe
ENV PORT=8080
ENV NODE_ENV=production

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY index.js .

EXPOSE 8080

#Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/healthz || exit 1

#Uruchomienie aplikacji
CMD ["node", "index.js"]
