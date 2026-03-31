# Stokvel Management Platform

A web-based stokvel management platform built for COMS3009A Software Design 2026.

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** PostgreSQL + Prisma
- **Auth:** Firebase Auth
- **Payments:** PayFast
- **Testing:** Jest
- **CI/CD:** GitHub Actions
- **Hosting:** Azure

## Prerequisites

Make sure you have the following installed before running the project:

- [Node.js v20+](https://nodejs.org/) — install via nvm (recommended):
```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  # restart terminal, then:
  nvm install 20
  nvm use 20
```
- [Git](https://git-scm.com/)

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/MubeenD1/Stokvel-Management-Platform.git
cd Stokvel-Management-Platform
```

### 2. Set up the server
```bash
cd server
npm install
```
Then open `server/.env` and fill in the values — get these from the team WhatsApp.

### 3. Set up the client
```bash
cd ../client
npm install
```

### To Run the project

In one terminal:
```bash
cd server
npm run dev
```

In another terminal:
```bash
cd client
npm run dev
```

Server runs on http://localhost:3000
Frontend runs on http://localhost:5173

## Environment Variables

All required environment variables are listed in `server/.env.example`.
Copy it to `server/.env`.
```bash
cd server
cp .env.example .env
```

The contents should be this: (Copy the key values from the team Notion)
```
DATABASE_URL=
FIREBASE_PROJECT_ID=
PAYFAST_MERCHANT_ID=
PAYFAST_MERCHANT_KEY=
PORT=3000
```

## Running Tests
```bash
cd server
npm test
```

## Team
- Zakithi Shube
- Sivunile Mlambo
- Katlego Masombuka
- Thabiso Ramaema
- Simphiwe Kwela
- Mubeen Dewan
