# Yoga & Mindfulness Studio — Booking System

Web Application Development 2

---

## How to Run Locally

### Prerequisites
- Node.js v18 or later
- npm

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/HassanA05/Yoga-Booking OR use the zip file
   cd yoga-booking
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Seed the database**
   ```bash
   npm run seed
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open in browser**  
   Go to `http://localhost:3000`

6. **Live Site**
    Go to yoga-booking-production.up.railway.app
    Note: The deployed version starts with an empty database. To see the site with sample data, run locally using npm run seed then npm start
---

## Login Credentials (after seeding)

| Role       | Email                    | Password      |
|------------|--------------------------|---------------|
| Organiser  | organiser@yoga.local     | organiser123  |
| Student    | student@yoga.local       | student123    |

---

## Running Tests

```bash
npm test
```

To run with coverage:
```bash
npm run test:coverage
```

---

## Implemented Features

### Public (no login required)
- View home page with upcoming courses
- Browse all courses with filter by level, type, drop-in availability, and text search
- View full course detail including session schedule, location, and pricing
- Paginated course listing

### Student (login required)
- Register a new account with email and password
- Login and logout securely (sessions with httpOnly cookies)
- Book a full course (all sessions)
- Book an individual drop-in session (where allowed by course)
- View booking confirmation with status (Confirmed / Waitlisted)
- View all personal bookings on My Bookings page

### Organiser (organiser role required)
- Login redirects to organiser dashboard
- **Courses:** Add, edit, and delete courses (with cascade delete of sessions and bookings)
- **Sessions:** Add and delete sessions within a course
- **Class Lists:** View participant list for a course, filterable by individual session
- **Users:** View all registered users, update roles (student ↔ organiser), remove users

### Security
- Passwords hashed with bcrypt (10 salt rounds)
- Sessions stored server-side with express-session
- httpOnly cookies prevent XSS access to session token
- Role-based access control — organiser routes return 403 for students
- Unauthenticated requests to protected routes redirect to login

---

## Project Structure

```
├── controllers/       # Request handlers
├── middlewares/       # Auth middleware (attachUser, requireLogin, requireOrganiser)
├── models/            # NeDB data access objects
├── routes/            # Express routers
├── services/          # Business logic (booking service)
├── views/             # Mustache templates
│   ├── partials/      # head, header, footer
│   ├── auth/          # login, register
│   └── organiser/     # dashboard, courses, sessions, class list, users
├── public/            # CSS
├── seed/              # Database seeding script
├── tests/             # Jest test suite
└── index.js           # App entry point
```

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Templates:** Mustache (mustache-express)
- **Database:** NeDB-promises (embedded flat-file)
- **Auth:** express-session + bcrypt
- **Testing:** Jest + Supertest
