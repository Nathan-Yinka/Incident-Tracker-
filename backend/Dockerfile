FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL and libssl for Prisma compatibility
RUN apt-get update && apt-get install -y openssl libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./
COPY prisma ./prisma
RUN npm ci

# Generate Prisma Client before building
RUN npx prisma generate

COPY . .
RUN npm run build

FROM node:20-slim AS production

WORKDIR /app

# Install OpenSSL and libssl for Prisma compatibility
RUN apt-get update && apt-get install -y openssl libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --only=production && npm install prisma

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/start.sh ./start.sh

# Generate Prisma Client in production stage
RUN npx prisma generate

# Make start script executable
RUN chmod +x start.sh

EXPOSE 3000

CMD ["./start.sh"]
