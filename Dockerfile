# Single-stage image kept simple on purpose: it runs anywhere that takes a
# Dockerfile (Render, Railway, Fly.io) with a small persistent volume for SQLite.
FROM node:20-slim AS base

# OpenSSL is required by Prisma's query engine on slim images.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies (dev deps included so `tsx` is available for seeding).
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest and build. The build never touches the database, but Prisma
# still wants DATABASE_URL to be defined — pass a throwaway value that only
# exists for this build step (the real one is injected at runtime by the host).
COPY . .
RUN DATABASE_URL="file:/tmp/build.db" npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# On boot: apply migrations, ensure demo data exists (idempotent seed), then start.
# DATABASE_URL should point at a file on the mounted volume, e.g.
#   DATABASE_URL="file:/data/prod.db"
CMD ["sh", "-c", "npx prisma migrate deploy && npm run db:seed && npm start"]
