# Hotel Management Platform

A full-stack hotel operations platform built with React Native, Expo, TypeScript, Express, Prisma, PostgreSQL, Stripe, and OpenAI-powered operational tools.

The project models real hotel workflows including room inventory, reservations, guest management, services, billing, reporting, role-based access control, and manager-facing operational insights.

The backend is deployed on Render and uses a hosted PostgreSQL database on Supabase. The project also includes Docker-based local development and automated CI with GitHub Actions.

---

## Tech Stack

### Frontend

* React Native
* Expo
* Expo Router
* TypeScript
* Axios
* Expo SecureStore

### Backend

* Node.js
* Express
* TypeScript
* Prisma ORM
* JWT
* bcrypt
* Zod
* Stripe
* OpenAI API

### Database

* PostgreSQL
* Supabase PostgreSQL for deployed data
* Prisma migrations
* Prisma seed workflow

### DevOps

* Docker
* Docker Compose
* GitHub Actions
* Render
* Supabase

### Testing

* Vitest
* Supertest
* PostgreSQL-backed integration and repository tests
* TypeScript type checking
* Expo lint

---

## Architecture

React Native / Expo
↓
HTTPS + JWT
↓
Express + TypeScript API
↓
Authentication / RBAC / Zod Validation
↓
Services
↓
Repositories
↓
Prisma ORM
↓
PostgreSQL
↓
Supabase

Production flow:

Frontend
↓
Render Web Service
↓
Express API
↓
Prisma
↓
Supabase PostgreSQL

---

## Core Features

### Authentication

The application uses real JWT-based authentication instead of a frontend demo token.

Features include:

* Username and password login
* bcrypt password hashing
* JWT token generation and verification
* Persistent mobile sessions using Expo SecureStore
* Automatic token attachment to API requests
* Automatic session cleanup after unauthorized responses
* Protected backend routes

Two hotel roles are currently supported:

* Manager
* Front Desk

---

## Role-Based Access Control

Backend routes and frontend navigation both enforce role-based permissions.

### Manager

Managers can access:

* Rooms
* Reservations
* Guests
* Services
* Billing
* Reports
* AI Operations
* Quality Analysis
* System Status

### Front Desk

Front Desk users can access:

* Rooms
* Reservations
* Guests
* Services
* Billing

Manager-only screens are hidden from Front Desk navigation and protected against direct route access.

---

## Rooms

The Rooms module provides:

* Hotel room inventory
* Room number and room type
* Nightly rate
* Maximum occupancy
* Wi-Fi and TV information
* Building information
* Balcony and smoking information
* Operational room status
* Search by room number or type
* Room-status filtering
* Loading, retry, and empty states

Operational room statuses include:

* Available
* Reserved
* Occupied
* Blocked

Reservation availability is handled separately using requested stay dates.

---

## Date-Based Room Availability

The backend exposes date-aware room availability rather than treating every future reservation as a permanent room-status change.

Example endpoint:

GET /api/rooms/available?checkIn=2026-09-10&checkOut=2026-09-13

A room is excluded when:

* the room is blocked
* a Confirmed or Pending reservation overlaps the requested dates

The overlap rule is:

existingCheckIn < requestedCheckOut
AND
existingCheckOut > requestedCheckIn

This allows valid back-to-back stays while preventing double booking.

---

## Reservations

Reservation workflows include:

* Create reservation
* Select an existing guest
* Create a new guest before reservation
* Choose check-in and check-out dates
* Validate reservation dates
* Check room availability before submission
* Prevent overlapping reservations
* Prevent reservations for blocked rooms
* Cancel reservations
* Track reservation status
* Store payment mode and special requests

Reservation creation uses a database transaction so partial reservation records are rolled back if the complete operation cannot be completed.

---

## Guests

Guest management includes:

* Create guests
* View guest profiles
* Contact information
* Membership information
* Preferred room type
* Payment information
* Reservation history
* Guest spending summary

Guest creation supports related membership and payment records through the backend data layer.

---

## Services

The application models hotel service workflows including:

* Room Service
* Spa Service
* Shuttle Service

Service functionality includes:

* Service creation
* Reservation association
* Assigned employees
* Service pricing
* Service status tracking
* Service-specific details

---

## Billing and Stripe

The billing module combines room charges and service charges into reservation billing summaries.

Features include:

* Reservation billing overview
* Room charges
* Service charges
* Grand total calculation
* Billing transaction records
* Stripe Checkout session creation
* Stripe session synchronization
* Payment status tracking
* Refund support
* Simulation mode for development and testing

Stripe secret keys remain on the backend and are never exposed to the React Native application.

Webhook infrastructure is included for Stripe payment events.

---

## Reports

Manager-only reporting currently includes room-type operational summaries such as:

* Number of rooms by type
* Average nightly rate by room type

The report screen includes loading, error, and empty states.

---

## AI Operations

The platform includes both deterministic operational analysis and OpenAI-powered manager tools.

### Local Operational Insights

The backend analyzes hotel data to identify:

* Room availability pressure
* Blocked room issues
* Reservation activity
* Service queue pressure
* Service revenue
* Low guest feedback
* High-value guests
* Room-type demand
* Operational risks

### AI Action Center

Manager-facing AI tools include:

* Operational action items
* Revenue opportunities
* Occupancy forecasting
* Manager recommendations
* Hotel-data-aware questions

### OpenAI Tools

When an OpenAI API key is configured, managers can use generative AI features based on hotel operational context.

---

## Quality and Guest Satisfaction

The Quality module analyzes feedback and operational data.

It includes:

* Overall feedback metrics
* Low-rating detection
* Room-type quality analysis
* Service quality analysis
* Complaint pattern detection
* Guest recovery opportunities
* Quality risk classification

This screen is restricted to Manager users.

---

## System Health

The backend exposes:

GET /api/health

The health endpoint verifies core backend readiness, including PostgreSQL connectivity.

The frontend also contains a System Status screen for checking application configuration and API connectivity.

---

## Database

The project originally used SQLite but was migrated to PostgreSQL and Prisma.

Current architecture:

Application
↓
Prisma ORM
↓
PostgreSQL

Major models include:

* Employee
* UserAccount
* Guest
* Membership
* PaymentInfo
* Room
* Reservation
* ReservationGuest
* Service
* RoomService
* SpaService
* ShuttleService
* Feedback
* BillingTransaction

Prisma handles:

* Schema definition
* Database access
* Relationships
* Migrations
* Development seeding

---

## Database Seeding

The project includes a repeatable seed workflow.

Run:

npx prisma db seed

The seed creates development and demo hotel data including:

* Rooms
* Guests
* Employees
* Reservations
* Services
* Feedback
* User accounts

---

## Demo Accounts

After running the seed workflow:

### Manager

Username: admin
Password: admin123

### Front Desk

Username: frontdesk
Password: frontdesk123

These credentials are intended only for the development and demo dataset.

---

## Project Structure

hotel-management-app/

* .github/

  * workflows/

    * ci.yml
* backend/

  * controllers/
  * database/
  * generated/
  * middleware/
  * prisma/
  * repositories/
  * routes/
  * services/
  * tests/
  * Dockerfile
  * .dockerignore
  * .env.example
  * prisma.config.ts
  * prismaClient.ts
  * server.ts
  * package.json
* frontend/

  * app/

    * (tabs)/
  * api/
  * constants/
  * context/
  * .env.example
  * package.json
* docker-compose.yml
* .gitignore
* README.md

---

## Environment Variables

Never commit production secrets.

Use the included `.env.example` files as templates.

### Backend

Create:

backend/.env

Example values:

PORT=5001
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=replace-with-a-long-random-secret
PUBLIC_BACKEND_URL=[http://localhost:5001](http://localhost:5001)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

Additional AI configuration may be provided when OpenAI-powered features are enabled.

### Frontend

Create:

frontend/.env.local

For a local backend:

EXPO_PUBLIC_API_URL=[http://localhost:5001](http://localhost:5001)

For the deployed backend:

EXPO_PUBLIC_API_URL=[https://YOUR-BACKEND.onrender.com](https://YOUR-BACKEND.onrender.com)

Do not commit `.env.local`.

---

## Running Locally

### Option 1 — Docker

Docker Compose runs both PostgreSQL and the backend.

From the project root:

docker compose up -d

Check running services:

docker compose ps

Seed the Docker database:

docker compose exec backend npx prisma db seed

The backend is available at:

[http://localhost:5001](http://localhost:5001)

Stop the environment with:

docker compose down

---

### Option 2 — Local Node.js Backend

A local PostgreSQL database must already be available.

From backend:

npm install
npx prisma generate
npx prisma migrate deploy
npm run dev

Backend:

[http://localhost:5001](http://localhost:5001)

---

## Running the Frontend

From frontend:

npm install
npx expo start

The application can be opened using:

* Expo Go
* iOS Simulator
* Android Emulator
* Expo Web

When using a physical phone with a locally hosted backend, localhost refers to the phone itself.

Use the Mac's local network address instead:

ipconfig getifaddr en0

Then configure:

EXPO_PUBLIC_API_URL=http://YOUR_MAC_IP:5001

When using the deployed Render backend, this local-network setup is not required.

---

## Docker

The project includes a Dockerized backend and PostgreSQL development environment.

Docker Compose provides:

* PostgreSQL 17
* Persistent PostgreSQL volume
* Database health checks
* Backend container
* Prisma migration deployment
* Environment-variable configuration

The Dockerized backend listens on:

0.0.0.0:5001

---

## Continuous Integration

GitHub Actions automatically validates pull requests and pushes to main.

### Backend CI

The backend workflow:

1. Starts PostgreSQL
2. Installs dependencies
3. Generates Prisma Client
4. Applies Prisma migrations
5. Runs TypeScript type checking
6. Runs the Vitest test suite

### Frontend CI

The frontend workflow:

1. Installs dependencies
2. Runs TypeScript type checking
3. Runs Expo lint

This prevents broken backend or frontend changes from being merged unnoticed.

---

## Testing

Backend tests use:

* Vitest
* Supertest
* PostgreSQL test database

Current automated coverage includes:

* Authentication
* Invalid credentials
* JWT-protected routes
* Manager and Front Desk authorization
* Room repository operations
* Guest repository operations
* Reservation creation
* Reservation cancellation
* Overlapping reservation prevention
* Blocked-room prevention
* Transaction rollback behavior

Run backend tests with:

cd backend
npm test

Type check:

npm run typecheck

Frontend validation:

cd frontend
npx tsc --noEmit
npm run lint

---

## Deployment

### Backend

The Express API is deployed as a Render Web Service.

The production backend:

* runs inside a Docker container
* connects to hosted PostgreSQL
* applies Prisma migrations
* reads secrets from Render environment variables
* exposes the public REST API over HTTPS

### Database

The deployed database runs on Supabase PostgreSQL.

Production database credentials are stored only as deployment environment variables.

---

## Security

The project includes several backend security controls:

* Password hashing with bcrypt
* JWT authentication
* Route-level role authorization
* Request validation with Zod
* Centralized backend error handling
* Backend-only Stripe credentials
* Environment-based secrets
* Protected Manager-only APIs
* Secure client-side JWT storage

Production secrets are excluded from Git.

---

## Key Engineering Improvements

The project evolved significantly from its initial implementation.

Major improvements include:

* Migrated SQLite to PostgreSQL
* Introduced Prisma ORM
* Added database migrations
* Added repeatable database seeding
* Replaced demo authentication with JWT authentication
* Added bcrypt password hashing
* Added Manager and Front Desk RBAC
* Added Zod validation
* Added centralized error handling
* Added transactional reservation creation
* Added correct date-overlap booking logic
* Added date-aware room availability API
* Added automated backend testing
* Added Stripe billing infrastructure
* Added persistent frontend authentication
* Added role-aware frontend navigation
* Added Docker development environment
* Added GitHub Actions CI
* Deployed backend and PostgreSQL infrastructure

---

## Future Improvements

Potential future additions include:

* Full production Stripe webhook verification
* Expanded integration and end-to-end testing
* Public Expo web deployment
* Advanced reservation search and filtering
* Manager dashboard visualizations
* Audit logging
* Staff account management
* Deployment monitoring and observability

---

## Purpose

This project was built to go beyond a basic CRUD application and practice real software engineering concepts across the full stack:

* API architecture
* Authentication
* Authorization
* Relational database design
* ORM migration
* Transactions
* Business-rule validation
* Automated testing
* Mobile application development
* Cloud deployment
* Containerization
* CI/CD
* Third-party API integration

The result is a production-style hotel operations platform that can be run locally with Docker or connected to its deployed backend.