# ---- Build Stage ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production && cp -R node_modules /prod_node_modules
RUN npm ci

COPY . .
RUN npm run build

# ---- Run Stage ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /prod_node_modules ./node_modules

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
