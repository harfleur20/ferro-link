FROM node:22-bookworm-slim AS client
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY public public
COPY src src
# Empty on purpose: the site and the API share the same address.
ENV VITE_API_URL=""
RUN npm run build

FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
COPY server/prisma prisma
RUN npm ci && npx prisma generate && npm cache clean --force
COPY server/src src
COPY --from=client /app/dist /app/dist
ENV NODE_ENV=production \
    PORT=4000 \
    CLIENT_DIST_DIR=/app/dist \
    PRIVATE_UPLOAD_DIR=/data/private-uploads \
    PUBLIC_SITE_ASSET_DIR=/data/site-assets
RUN mkdir -p /data/private-uploads /data/site-assets && chown -R node:node /data
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "npx prisma migrate deploy && exec node src/index.js"]
