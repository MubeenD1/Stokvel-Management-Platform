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
- **Hosting:** Azure + Neon

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

npx prisma generate
npx prisma migrate dev
```

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

### Server — `server/.env`
Copy `server/.env.example` to `server/.env` and fill in the values from the team.

```
DATABASE_URL=           ← Neon PostgreSQL connection string (get from team)
FIREBASE_PROJECT_ID=    ← Firebase project ID (get from team)
PAYFAST_MERCHANT_ID=    ← PayFast merchant ID (get from team)
PAYFAST_MERCHANT_KEY=   ← PayFast merchant key (get from team)
PORT=3000
```

### Client — `client/.env`
Copy `client/.env.example` to `client/.env` and fill in the values from the team.

```
VITE_FIREBASE_API_KEY=              ← get from team
VITE_FIREBASE_AUTH_DOMAIN=          ← get from team
VITE_FIREBASE_PROJECT_ID=           ← get from team
VITE_FIREBASE_STORAGE_BUCKET=       ← get from team
VITE_FIREBASE_MESSAGING_SENDER_ID=  ← get from team
VITE_FIREBASE_APP_ID=               ← get from team
```

### Firebase Service Account Key
The backend also needs a `server/serviceAccountKey.json` file to verify Firebase tokens.
This file is never pushed to GitHub. Get it from the team and place it at `server/serviceAccountKey.json`.

---

## Database

The project uses PostgreSQL hosted on Neon, managed through Prisma.

### First time setup
After filling in your `DATABASE_URL` in `server/.env`, run:
```bash
cd server
npx prisma migrate dev
```
This applies all existing migrations and creates the tables in your local connection.

### Viewing the database
```bash
cd server
npx prisma studio
```
Opens a browser tab where you can visually browse and edit database records. Useful for debugging.

### When someone changes the schema
If a teammate updates `prisma/schema.prisma` and pushes a new migration, you need to apply it locally:
```bash
cd server
npx prisma migrate dev
```
Always run this after pulling changes if you see new files in `server/prisma/migrations/`.

### Adding a new model
1. Add the model to `server/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name describe-your-change`
3. Commit and push the updated schema and migration files

---

## Authentication

The project uses Firebase Auth on the frontend and Firebase Admin SDK on the backend.

### How it works
1. User logs in via Firebase on the frontend
2. Firebase returns a token
3. Frontend sends that token in the `Authorization` header with every API request
4. Backend middleware verifies the token before allowing access to protected routes

### Using auth in a new frontend page
Import and use the `auth` object from `src/firebase.js`:
```javascript
import { auth } from '../firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'

const userCredential = await signInWithEmailAndPassword(auth, email, password)
const token = await userCredential.user.getIdToken()
```

### Protecting a backend route
Import and apply the `verifyToken` middleware:
```javascript
const { verifyToken } = require('../middleware/authMiddleware')

router.get('/protected-route', verifyToken, yourController)
```
The verified user's Firebase data will be available as `req.user` inside the controller.

### Getting the current user's database record
After verifying the token, use `req.user.uid` to look up the user in PostgreSQL:
```javascript
const user = await prisma.user.findUnique({
  where: { firebaseId: req.user.uid }
})
```

---

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
