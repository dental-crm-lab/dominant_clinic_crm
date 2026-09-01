# Dominant CRM — single-container deploy (Express API + static PWA frontend).
# Uses Node's built-in node:sqlite, so no native binary download/compile step
# is needed on any platform (this is also why we avoided Prisma).
FROM node:22-slim

WORKDIR /app

# Install server dependencies first so this layer is cached across deploys
# that only change application code.
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --omit=dev

# App code
COPY server ./server
COPY web ./web

ENV NODE_ENV=production
ENV PORT=4000
# Railway: mount a persistent volume at /data and set DATABASE_PATH=/data/dominant.db
# via the dashboard (Variables tab) so the clinic's data survives redeploys.
ENV DATABASE_PATH=/app/server/data/dominant.db

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||4000)+'/api/health', r => process.exit(r.statusCode===200?0:1)).on('error', () => process.exit(1))"

CMD ["node", "server/src/index.js"]
