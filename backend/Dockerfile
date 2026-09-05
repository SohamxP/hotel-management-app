FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run typecheck

EXPOSE 5001

CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx server.ts"]