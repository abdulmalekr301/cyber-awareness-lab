FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN --mount=type=cache,id=cyberlab-npm,target=/root/.npm \
    npm ci --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000
COPY . .
RUN DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    TURSO_DATABASE_URL=file:/tmp/build-only.db npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN --mount=type=cache,id=cyberlab-npm,target=/root/.npm \
    npm ci --omit=dev --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/backend/src/generated/turso backend/dist/generated/turso
COPY --from=build /app/frontend/dist frontend/dist
COPY --from=build /app/node_modules/.prisma node_modules/.prisma
COPY --from=build /app/node_modules/@prisma node_modules/@prisma
COPY prisma prisma
USER node
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node backend/dist/server.js"]
