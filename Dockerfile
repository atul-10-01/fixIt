# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install ALL dependencies (including devDeps needed for build)
COPY package*.json ./
RUN npm ci

# Copy full source
COPY . .

# Build: Vite bundles the React frontend + esbuild bundles server → dist/
RUN npm run build

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Only install production dependencies (esbuild used --packages=external)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Copy static assets folder (logo etc. referenced by Express static middleware)
COPY --from=builder /app/assets ./assets

# Cloud Run injects PORT env var; fallback to 3000
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
