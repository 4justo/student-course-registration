FROM node:20-bookworm-slim

WORKDIR /usr/src/app

# Prisma needs OpenSSL at build and runtime; slim images omit it by default.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates libssl3 \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
# Copy Prisma schema so `prisma generate` can run before copying rest of the
# repository (keeps layers cache-friendly).
COPY prisma ./prisma

# Install all deps so we can run `prisma generate` for the correct binary targets,
# then remove dev deps to keep the final image lean.
RUN npm install && npx prisma generate && npm prune --production

# Copy the rest of the repository
COPY . .

EXPOSE 4000

ENV NODE_ENV=production
# Use the backend entrypoint path used by package.json
CMD ["node", "backend/server/index.js"]
