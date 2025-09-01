# -------- Stage 1: Build --------
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar deps
COPY package*.json ./
# Si NO tienes package-lock.json, usa: RUN npm install
RUN npm ci

# Copiar código y compilar
COPY . .
RUN npm run build

# Quitar dev deps para producción
RUN npm prune --omit=dev

# -------- Stage 2: Runtime --------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copiamos solo lo necesario
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Puerto de Nest
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/main.js"]
