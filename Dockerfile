FROM node:20-alpine

WORKDIR /usr/src/app

RUN apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json* ./
COPY prisma ./prisma

RUN npm install \
  && npx prisma generate \
  && npm prune --production

COPY . .
RUN chmod +x scripts/start.sh

EXPOSE 4000

ENV NODE_ENV=production
CMD ["sh", "scripts/start.sh"]
