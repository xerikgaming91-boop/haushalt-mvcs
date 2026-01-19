# Haushalt MVCS (strict)

## Start (lokal)

### Backend
cd server
copy .env.example .env   (Windows)  /  cp .env.example .env (macOS/Linux)
npm install
npx prisma migrate dev --name init
npm run dev

### Frontend
cd client
copy .env.example .env   (Windows)  /  cp .env.example .env (macOS/Linux)
npm install
npm run dev

- Client: http://localhost:5173
- API: http://localhost:3001/health

## Architektur (strict MVCS)

Backend:
- Model: Prisma Schema + DB
- View: JSON (HTTP Response)
- Controller: Request/Response + Input Parsing, keine Business-Regeln
- Service: Business-Logik + Transaktionen
- Repository: DB-Zugriffe (Prisma)

Frontend:
- Model: DTOs / UI Models
- View: React Pages/Components (presentational)
- Controller: Hooks (Orchestrierung), rufen Services
- Service: API Client Layer
