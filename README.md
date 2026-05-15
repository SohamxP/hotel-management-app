# Hotel Management Platform

A full-stack hotel management mobile app built with React Native, Expo Router, TypeScript, Node.js, Express, SQLite, OpenAI API, and Stripe Checkout.

This project simulates a single-hotel operations platform for managing rooms, reservations, guests, services, reports, AI-powered operations insights, guest satisfaction, system health, and billing workflows.

## Tech Stack

### Frontend

- React Native
- Expo Router
- TypeScript
- Axios
- Expo Go for local device testing

### Backend

- Node.js
- Express
- TypeScript
- SQLite
- OpenAI API
- Stripe Checkout

### Database

- SQLite database adapted from a normalized hotel database schema
- Tables include rooms, guests, reservations, services, feedback, employees, memberships, payment information, and billing transactions

## Core Features

### Authentication

- Demo login/auth flow
- Protected backend routes using token middleware
- Frontend API helper automatically sends the auth token

### Rooms

- View all hotel rooms
- See room type, rate, availability, occupancy, amenities, and building information
- Reserve available rooms
- Reservation updates synchronize room availability

### Reservations

- View reservation records
- Track reservation status
- Connect reservations to guests, rooms, services, and payment mode

### Guests

- View guest profiles
- Show contact information and guest details
- Connect guests to memberships and reservations

### Services

- View hotel services such as room service, spa, and shuttle
- Track service status, price, assigned employee, and service details

### Reports

- Operational reports from SQLite data
- Room type summaries
- Revenue and reservation analytics

## AI Features

The app includes both rule-based hotel insights and OpenAI-powered manager tools.

### Local Rule-Based AI Insights

- Room availability insights
- Blocked room alerts
- Service queue analysis
- Service revenue analysis
- Low feedback detection
- Top guest insights
- Room type pressure signals

### OpenAI-Powered Features

- Daily Manager Briefing
- Ask OpenAI
- AI Action Center
- AI Guest Recovery Drafts
- AI Revenue Opportunity Engine
- AI Occupancy Forecast Engine
- AI Quality / Guest Satisfaction Engine

## Billing and Stripe

The billing module supports:

- Reservation bill summaries
- Room charge plus service charge totals
- Backend-only Stripe Checkout session creation
- Stripe success/cancel redirect pages
- Stripe session sync into SQLite
- Demo-safe payment status updates
- Manual mark-paid and refund actions for testing

Stripe keys are stored only in `backend/.env`.

The frontend never receives or stores the Stripe secret key.

## System Status Tab

The app includes a System Status screen for demo readiness.

It checks:

- Frontend API base URL
- Backend health
- SQLite connection
- OpenAI configuration
- Stripe configuration
- Enabled app features

This is useful before interviews, demos, or Expo Go testing.

## Project Structure

```txt
hotel-management-app/
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── repositories/
│   ├── database/
│   ├── db.ts
│   ├── server.ts
│   └── .env
│
├── frontend/
│   ├── app/
│   │   └── (tabs)/
│   ├── api/
│   │   └── api.ts
│   ├── constants/
│   │   └── theme.ts
│   └── .env.local
│
└── README.md
```

## Environment Variables

### Backend

Create this file:

```txt
backend/.env
```

Example:

```env
PORT=5001

OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-4o-mini

STRIPE_SECRET_KEY=sk_test_your_stripe_key_here
STRIPE_CURRENCY=usd
PUBLIC_BACKEND_URL=http://localhost:5001
STRIPE_SUCCESS_URL=http://localhost:5001/payment-success?session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=http://localhost:5001/payment-cancelled
```

### Frontend

Create this file:

```txt
frontend/.env.local
```

For Mac simulator:

```env
EXPO_PUBLIC_API_URL=http://localhost:5001
```

For Expo Go on a physical phone:

```env
EXPO_PUBLIC_API_URL=http://YOUR_MAC_WIFI_IP:5001
```

Example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.23:5001
```

## Running the App Locally

### 1. Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on:

```txt
http://localhost:5001
```

For phone testing, the backend must listen on `0.0.0.0`:

```ts
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
```

### 2. Start Frontend

```bash
cd frontend
npm install
npx expo start -c
```

Then open the app using:

- iOS Simulator
- Android Emulator
- Expo Go on phone

## Phone Testing Notes

A physical phone cannot use `localhost` to reach the backend running on the Mac.

Use your Mac Wi-Fi IP:

```bash
ipconfig getifaddr en0
```

Then set this in `frontend/.env.local`:

```env
EXPO_PUBLIC_API_URL=http://YOUR_MAC_IP:5001
```

Phone and Mac must be on the same Wi-Fi.

## Demo Flow

Recommended demo order:

1. Login
2. Open Rooms tab
3. Reserve a room
4. Open Reservations tab
5. Open Guests tab
6. Open Services tab
7. Open Reports tab
8. Open AI tab
9. Generate Daily Manager Briefing
10. Use Ask OpenAI
11. Open Quality tab
12. Generate a guest recovery draft
13. Open Billing tab
14. Create a Stripe Checkout session
15. Complete test payment or use demo mark-paid
16. Open Status tab and show system health

## Stripe Test Card

Use this card in Stripe test mode:

```txt
4242 4242 4242 4242
Any future expiry
Any 3-digit CVC
Any ZIP
```

## What Is Real vs Simulated

### Real

- React Native frontend
- Express backend
- SQLite database
- REST API endpoints
- OpenAI API calls
- Stripe Checkout session creation
- Stripe success/cancel redirect pages
- Local phone testing through Expo Go

### Simulated / Demo-Oriented

- Demo authentication token
- Local SQLite database instead of deployed production database
- Manual mark-paid/refund actions for testing
- Stripe webhook not implemented
- No production deployment yet

## Interview Explanation

This project demonstrates a full-stack mobile application where the frontend, backend, database, AI layer, and payment layer work together.

A typical flow:

1. User taps a button in the React Native app.
2. Axios sends a request to the Express backend.
3. Backend validates the request and runs SQLite queries.
4. Backend returns JSON.
5. Frontend updates state and re-renders the screen.

For AI features:

1. Backend gathers hotel data from SQLite.
2. Backend builds a structured prompt.
3. OpenAI generates manager-facing recommendations.
4. Frontend displays the generated response.

For Stripe:

1. Frontend requests checkout creation.
2. Backend creates the Stripe Checkout session using the secret key.
3. Frontend opens the checkout URL.
4. Stripe redirects to backend success/cancel pages.
5. Backend syncs payment status into SQLite.