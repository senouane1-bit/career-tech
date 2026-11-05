FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --no-audit --no-fund
COPY backend backend
COPY database database
RUN npm run build -w backend && npm prune --omit=dev
ENV NODE_ENV=production
ENV PORT=4000
USER node
EXPOSE 4000
CMD ["sh", "-c", "node database/migrate.mjs && node backend/dist/local.js"]
