FROM node:20-bookworm

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
COPY prisma ./prisma

RUN npm install && npx prisma generate && npm prune --production

COPY . .

EXPOSE 4000

ENV NODE_ENV=production
CMD ["node", "backend/server/index.js"]
