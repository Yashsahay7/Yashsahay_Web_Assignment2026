# E-Cell IIT Bombay — Query & Issue Management Portal

> Assignment 2 — Web & Tech Manager Position

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) |
| File uploads | Multer |

## Project Structure

```
ecell-portal/
├── server/              # Express backend
│   ├── models/          # Mongoose schemas (User, Query)
│   ├── controllers/     # Business logic
│   ├── routes/          # API route definitions
│   ├── middleware/       # auth.js (JWT), upload.js (Multer)
│   ├── uploads/         # Uploaded files (gitignored)
│   ├── index.js         # App entry point
│   └── seed.js          # Demo data seeder
│
└── client/              # React frontend
    └── src/
        ├── components/  # Reusable UI components
        ├── context/     # AuthContext (global state)
        ├── pages/       # Route-level page components
        ├── utils/       # api.js (axios), helpers.js
        └── styles/      # global.css (design tokens)
```

## Setup & Running

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd server
npm install
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
npm run dev
```

### Seed demo data

```bash
cd server
node seed.js
```

### Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, proxies `/api` to `http://localhost:5000`.

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ecell.com | admin123 |
| Manager (Tech) | manager@ecell.com | manager123 |
| Manager (Events) | events@ecell.com | events123 |
| Member | member@ecell.com | member123 |

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Queries
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/queries` | All | List queries (role-filtered) |
| POST | `/api/queries` | All | Create query + attachments |
| GET | `/api/queries/stats` | All | Dashboard stats |
| GET | `/api/queries/:id` | All | Get single query |
| PATCH | `/api/queries/:id` | Admin/Manager | Update status/assignee |
| DELETE | `/api/queries/:id` | Admin | Delete query |
| POST | `/api/queries/:id/comments` | All | Add comment |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Admin | List all users |
| GET | `/api/users/managers` | All | List managers (for assignment) |
| PATCH | `/api/users/:id/role` | Admin | Change user role |
| PATCH | `/api/users/:id/deactivate` | Admin | Deactivate user |

## Access Control Model

| Role | Can See | Can Edit | Can Delete |
|------|---------|----------|------------|
| Admin | All queries | All queries | Yes |
| Manager | Own domain queries | Own domain | No |
| Member | Own queries only | None | No |

## Key Design Decisions

1. **JWT stateless auth** — no server-side sessions; scales horizontally
2. **Role + Domain model** — managers scoped to a domain (tech/events/etc.), not just a generic manager role
3. **Embedded comments** — stored inside the Query document for simple retrieval, avoids joins
4. **Auto-assignment** — when a query is created, it automatically finds the manager of that domain
5. **Status history** — every status change is logged with who changed it and when