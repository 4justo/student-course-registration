FROM node:20-bookworm

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
COPY prisma ./prisma

# OpenSSL must be present before `prisma generate` and at runtime.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl libssl3 ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && openssl version \
  && npm install \
  && npx prisma generate \
  && npm prune --production

COPY . .

EXPOSE 4000

ENV NODE_ENV=production
CMD ["node", "backend/server/index.js"]
