WE Brand OS - Monorepo

- backend: Node.js + Express + TypeScript + Prisma + PostgreSQL
- frontend: (planned) Expo + React Native for Web (to be added next)

Getting started:
1) docker compose up -d
2) cd backend && cp .env.example .env && npm install
3) npx prisma migrate dev --name init
4) npm run dev
