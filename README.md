# Hotel Management Platform

A production-style full-stack hotel operations platform built with **React Native, Expo, TypeScript, Express, Prisma, PostgreSQL, Stripe, Docker, and GitHub Actions**.

The application supports real hotel workflows including reservations, date-based room availability, guest management, services, billing, reporting, role-based access control, operational analytics, and AI-assisted management tools.

The backend is deployed on **Render**, production data is stored in **Supabase PostgreSQL**, and Stripe Checkout is integrated with a deployed, signature-verified webhook flow.

---

## Highlights

- Full-stack React Native + Express application
- JWT authentication with persistent mobile sessions
- Manager / Front Desk role-based access control
- PostgreSQL + Prisma ORM
- Correct reservation overlap prevention
- Date-aware room availability
- Transaction-safe reservation creation
- Stripe Checkout integration
- Signature-verified Stripe webhooks
- Billing and payment status synchronization
- Dockerized local development
- Automated backend testing with Vitest + Supertest
- GitHub Actions CI
- Render + Supabase production deployment
- AI-assisted hotel operations and quality analysis

---

## Production Architecture

```mermaid
flowchart TD
    A[React Native / Expo Client]
    B[HTTPS + JWT]
    C[Render - Express / TypeScript API]
    D[Authentication / RBAC / Zod]
    E[Service Layer]
    F[Repository Layer]
    G[Prisma ORM]
    H[Supabase PostgreSQL]
    I[Stripe Checkout]
    J[Stripe Webhooks]
    K[OpenAI API]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H

    E --> I
    I --> J
    J --> C

    E --> K
```

### Deployed Backend

`https://hotel-management-app-se81.onrender.com`

Health check:

`GET /api/health`

---

# Tech Stack

## Frontend

- React Native
- Expo
- Expo Router
- TypeScript
- Axios
- Expo SecureStore

## Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- JWT
- bcrypt
- Zod
- Stripe
- OpenAI API

## Database

- PostgreSQL
- Supabase PostgreSQL
- Prisma migrations
- Prisma seed workflow

## Testing

- Vitest
- Supertest
- PostgreSQL-backed integration tests
- TypeScript type checking
- Expo lint

## DevOps

- Docker
- Docker Compose
- GitHub Actions
- Render
- Supabase

---

# Core Features

## Authentication

The application uses backend-issued JWT authentication rather than frontend-only demo authentication.

Features include:

- username/password login
- bcrypt password hashing
- JWT generation and verification
- protected API routes
- persistent mobile sessions with Expo SecureStore
- automatic authentication headers
- session cleanup after unauthorized responses

Two application roles are supported:

- **Manager**
- **Front Desk**

---

## Role-Based Access Control

Permissions are enforced both in the backend and frontend.

### Manager

Managers can access:

- Rooms
- Reservations
- Guests
- Services
- Billing
- Reports
- AI Operations
- Quality Analysis
- System Status

### Front Desk

Front Desk users can access:

- Rooms
- Reservations
- Guests
- Services
- Billing

Manager-only routes are protected by backend authorization middleware and hidden from Front Desk navigation.

---

## Room Management

The room module supports:

- hotel room inventory
- room number and room type
- nightly pricing
- occupancy limits
- amenities
- building information
- room search
- room filtering
- operational room status

Operational statuses include:

- Available
- Reserved
- Occupied
- Blocked

Operational room status is intentionally separated from future reservation availability.

---

## Date-Based Room Availability

Room availability is calculated using requested stay dates.

Example:

```http
GET /api/rooms/available?checkIn=2026-09-10&checkOut=2026-09-13
```

A room is unavailable when:

1. the room is operationally blocked, or
2. a Confirmed or Pending reservation overlaps the requested interval

The overlap rule is:

```text
existingCheckIn < requestedCheckOut
AND
existingCheckOut > requestedCheckIn
```

This prevents double booking while still allowing valid back-to-back reservations.

---

## Reservations

Reservation workflows include:

- create reservations
- select existing guests
- create guests before reservation
- validate check-in/check-out dates
- query date-based room availability
- prevent overlapping bookings
- reject blocked rooms
- cancel reservations
- track reservation status
- store payment modes
- store special requests

Reservation creation runs inside a **database transaction**, preventing partial records if the workflow fails.

---

## Guest Management

Guest functionality includes:

- guest creation
- guest profiles
- contact information
- memberships
- preferred room type
- payment information
- reservation history
- guest spending summaries

Related guest data is handled through the backend service/repository architecture.

---

## Hotel Services

The platform models:

- Room Service
- Spa Service
- Shuttle Service

Service records support:

- reservation association
- employee assignment
- service pricing
- status tracking
- service-specific details

---

# Billing and Stripe

The billing system calculates reservation charges from room costs and associated hotel services.

Features include:

- reservation billing summaries
- room charges
- service charges
- grand total calculation
- billing transaction persistence
- Stripe Checkout session creation
- payment status synchronization
- payment completion tracking
- Manager-controlled refund workflow
- safe simulation mode when Stripe is unavailable

Stripe credentials are stored only on the backend.

## Stripe Checkout Flow

```text
Mobile App
   ↓
POST /api/billing/checkout
   ↓
Express Backend
   ↓
Stripe Checkout Session
   ↓
Stripe Hosted Checkout
   ↓
Payment Completed
   ↓
checkout.session.completed
   ↓
Signature-Verified Webhook
   ↓
Billing Transaction Updated
   ↓
PostgreSQL
```

## Webhook Verification

The deployed backend exposes:

```http
POST /api/webhooks/stripe
```

The endpoint:

- reads Stripe's raw request body
- requires the `stripe-signature` header
- verifies events using `STRIPE_WEBHOOK_SECRET`
- rejects unsigned or invalid events
- processes `checkout.session.completed`
- processes `checkout.session.expired`
- synchronizes payment status into PostgreSQL

The deployed integration has been verified end-to-end using Stripe test mode:

```text
Checkout Session Created
→ Test Payment Completed
→ Stripe Event Generated
→ Webhook Delivered
→ HTTP 200
→ Billing Record Updated to Paid
```

---

# Reports

Manager-only reports currently include room-type operational summaries such as:

- room count by type
- average nightly rate by room type

The interface includes loading, error, retry, and empty states.

---

# AI Operations

The platform includes deterministic analytics alongside optional OpenAI-powered management tools.

## Operational Insights

The backend can analyze:

- room availability pressure
- blocked-room issues
- reservation activity
- service workload
- service revenue
- poor guest feedback
- high-value guests
- room-type demand
- operational risks

## AI Action Center

Manager tools include:

- operational action items
- revenue opportunities
- occupancy-related insights
- manager recommendations
- hotel-data-aware questions

When an OpenAI API key is configured, the backend can generate contextual recommendations based on current hotel data.

---

# Quality Analysis

The Manager-only Quality module analyzes guest feedback and operational data.

It includes:

- overall feedback metrics
- low-rating detection
- room-type quality analysis
- service quality analysis
- complaint pattern detection
- guest recovery opportunities
- quality risk classification

---

# Database Architecture

The project was originally built using SQLite and later migrated to a production-style PostgreSQL architecture.

Current flow:

```text
Express
   ↓
Service Layer
   ↓
Repository Layer
   ↓
Prisma ORM
   ↓
PostgreSQL
```

Major models include:

- Employee
- UserAccount
- Guest
- Membership
- PaymentInfo
- Room
- Reservation
- ReservationGuest
- Service
- RoomService
- SpaService
- ShuttleService
- Feedback
- BillingTransaction

Prisma is used for:

- relational schema definition
- database queries
- migrations
- relationships
- transactions
- repeatable seeding

---

# Database Seeding

Seed the development database with:

```bash
npx prisma db seed
```

The seed workflow creates demo data including:

- rooms
- guests
- employees
- reservations
- services
- feedback
- application users

---

# Demo Accounts

These accounts are intended only for the development/demo dataset.

## Manager

```text
Username: admin
Password: admin123
```

## Front Desk

```text
Username: frontdesk
Password: frontdesk123
```

---

# Project Structure

```text
hotel-management-app/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── backend/
│   ├── controllers/
│   ├── database/
│   ├── generated/
│   ├── middleware/
│   ├── prisma/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── tests/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   ├── prisma.config.ts
│   ├── prismaClient.ts
│   ├── server.ts
│   └── package.json
│
├── frontend/
│   ├── app/
│   │   └── (tabs)/
│   ├── api/
│   ├── constants/
│   ├── context/
│   ├── .env.example
│   └── package.json
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# Environment Variables

Never commit production secrets.

Use the provided `.env.example` files.

## Backend

Create:

```text
backend/.env
```

Example:

```env
PORT=5001
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=replace-with-a-long-random-secret
PUBLIC_BACKEND_URL=http://localhost:5001
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Optional AI configuration can also be supplied when OpenAI-powered tools are enabled.

## Frontend

Create:

```text
frontend/.env.local
```

Local backend:

```env
EXPO_PUBLIC_API_URL=http://localhost:5001
```

Deployed backend:

```env
EXPO_PUBLIC_API_URL=https://hotel-management-app-se81.onrender.com
```

---

# Running Locally

## Docker

From the project root:

```bash
docker compose up -d
```

Check containers:

```bash
docker compose ps
```

Seed the database:

```bash
docker compose exec backend npx prisma db seed
```

Backend:

```text
http://localhost:5001
```

Stop the stack:

```bash
docker compose down
```

---

## Local Backend Without Docker

A PostgreSQL database must already be running.

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

---

# Running the Frontend

```bash
cd frontend
npm install
npx expo start
```

The application can run with:

- Expo Go
- iOS Simulator
- Android Emulator
- Expo Web

When using a physical device with a locally hosted backend, use the computer's LAN IP instead of `localhost`.

On macOS:

```bash
ipconfig getifaddr en0
```

Then configure:

```env
EXPO_PUBLIC_API_URL=http://YOUR_MAC_IP:5001
```

This is unnecessary when using the deployed Render backend.

---

# Docker

The local Docker environment includes:

- PostgreSQL 17
- persistent PostgreSQL storage
- PostgreSQL health checks
- backend container
- Prisma migration deployment
- environment-based configuration

The containerized Express server listens on:

```text
0.0.0.0:5001
```

---

# Continuous Integration

GitHub Actions validates backend and frontend changes.

## Backend CI

The workflow:

1. starts PostgreSQL
2. installs Node dependencies
3. generates Prisma Client
4. applies migrations
5. runs TypeScript type checking
6. executes the Vitest suite

## Frontend CI

The workflow:

1. installs dependencies
2. runs TypeScript type checking
3. runs Expo lint

---

# Testing

Backend tests use:

- Vitest
- Supertest
- PostgreSQL test database

Coverage currently includes:

- authentication
- invalid credentials
- JWT-protected routes
- Manager authorization
- Front Desk authorization
- room repository operations
- guest repository operations
- reservation creation
- reservation cancellation
- reservation overlap prevention
- blocked-room prevention
- transaction rollback behavior

Run:

```bash
cd backend
npm test
```

Type check:

```bash
npm run typecheck
```

Frontend:

```bash
cd frontend
npx tsc --noEmit
npm run lint
```

---

# Deployment

## Backend

The Express API is deployed as a Docker-based Render Web Service.

Production backend:

```text
https://hotel-management-app-se81.onrender.com
```

The deployed backend:

- runs inside a Docker container
- exposes the REST API over HTTPS
- connects to Supabase PostgreSQL
- executes Prisma migrations
- uses deployment environment variables
- integrates with Stripe Checkout
- receives Stripe webhook events

## Database

Production data is stored in Supabase PostgreSQL.

Database credentials and application secrets remain outside source control.

---

# Security

The application includes:

- bcrypt password hashing
- JWT authentication
- route-level authorization
- Manager / Front Desk RBAC
- Zod request validation
- centralized error handling
- backend-only Stripe credentials
- Stripe webhook signature verification
- environment-based secrets
- protected Manager APIs
- Expo SecureStore authentication storage

---

# Engineering Evolution

The project began as a simpler hotel application and was progressively hardened into a production-style system.

Major engineering improvements include:

- migrated SQLite to PostgreSQL
- introduced Prisma ORM
- added database migrations
- added repeatable database seeding
- replaced demo authentication with JWT authentication
- implemented bcrypt password hashing
- implemented Manager / Front Desk RBAC
- added Zod validation
- added centralized error handling
- added service and repository architecture
- implemented transactional reservation creation
- implemented correct interval-overlap booking logic
- added date-based room availability
- built Stripe Checkout billing
- implemented signature-verified Stripe webhooks
- verified Stripe payment processing end-to-end
- added persistent mobile authentication
- added role-aware frontend navigation
- added automated backend testing
- added Docker local development
- added GitHub Actions CI
- deployed the backend to Render
- migrated production data to Supabase PostgreSQL

---

# Future Improvements

Potential extensions include:

- public Expo web deployment
- expanded end-to-end frontend testing
- advanced reservation search and filtering
- dashboard visualizations
- audit logging
- staff account administration
- deployment monitoring and observability

---

# Project Goal

This project was built to practice more than CRUD development.

It covers real software-engineering concerns including:

- API architecture
- authentication
- authorization
- relational database design
- ORM migration
- transactions
- business-rule validation
- automated testing
- mobile development
- cloud deployment
- containerization
- CI/CD
- third-party payment integration
- webhook security
- AI API integration

The result is a deployable hotel operations platform with a mobile client, production backend, PostgreSQL database, automated tests, CI, containerized local environment, and verified payment workflow.