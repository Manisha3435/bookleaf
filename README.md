# BookLeaf Author Support & AI Ticketing Portal

A complete, production-grade **Author Support & AI Ticketing Portal** built for **BookLeaf Publishing** using **Next.js (App Router), TypeScript, MongoDB Atlas, Mongoose, JWT, Zod, Tailwind CSS, and AI Integration**.

---

## 🌟 Key Architecture & Highlights

```text
                    ┌────────────────────┐
                    │  Author / Admin    │
                    │      Browser       │
                    └─────────┬──────────┘
                              │
                        HTTP / REST
                              │
                              ▼
                    ┌────────────────────┐
                    │      Next.js       │
                    │   App Router &     │
                    │   Route Handlers   │
                    │                    │
                    │ • Authentication   │
                    │ • Role Auth (RBAC) │
                    │ • Input Validation │
                    │ • Security Checks  │
                    └──────┬───────┬─────┘
                           │       │
             Mongoose ODM  │       │ Category-Scoped KB Prompting
                           ▼       ▼
                    ┌──────────┐  ┌──────────────┐
                    │ MongoDB  │  │ AI Service   │
                    │ Atlas    │  │ (GPT-4o-mini │
                    └──────────┘  │  / Gemini)   │
                                  └──────┬───────┘
                                         │
                                         ▼
                                  AI Provider API
```

* **Production Stack**: Next.js App Router, TypeScript, MongoDB Atlas, Mongoose, JWT (HTTP-Only cookies), Zod input validation, Bcrypt password hashing, and Tailwind CSS.
* **Separation of Concerns**: Database models (`models/`), authentication & security (`lib/auth.ts`, `lib/jwt.ts`, `permissions.ts`), AI services (`lib/ai/`), and API routes (`app/api/`) are cleanly decoupled.
* **Strict Server-Side Authorization**: Authors can ONLY view and access their own books and tickets. Admins can view and manage all authors, books, and tickets.
* **Database-First Resilience**: Tickets are ALWAYS saved to MongoDB BEFORE AI processing. If the AI provider is unavailable, rate-limited, or fails, ticket creation succeeds and defaults to a safe fallback (`General` category, `Medium` priority, standard response).
* **Cost-Optimized AI Pipeline**:
  1. Small prompt for classification (`subject` + `description` ONLY).
  2. Category lookup.
  3. Load ONLY the relevant category Knowledge Base section (`knowledge-base/*.md`).
  4. Generate empathetic, data-informed support reply.
* **Confidential Internal Notes**: Admin internal notes are strictly filtered and NEVER exposed in author-facing API responses or UI.
* **Null-Safe Data Presentation**: Gracefully formats `mrp = null`, `copiesSold = null`, `publicationDate = null` as `—` while correctly displaying `0` as `₹0`. Production edge case books (`BK013`, `BK015`) work seamlessly.

---

## 🚀 Test Accounts & Demo Credentials

The database comes pre-seeded with test accounts covering all business logic edge cases:

| Role | Name | Email | Password | Scenario / Highlights |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | BookLeaf Admin | `admin@bookleaf.com` | `admin123` | Full access to command desk, queue, overrides, notes & KB |
| **Author** | General Author | `author@example.com` | `author123` | Standard author account |
| **Author** | Kavita Sharma | `kavita@example.com` | `kavita123` | **₹850 Pending Royalty** (Below ₹1,000 threshold, rollover rule) |
| **Author** | Arjun Mehta | `arjun@example.com` | `arjun123` | **Overdue Royalty** (₹4,200 pending, last payout May 2025, 48h escalation) |
| **Author** | Ananya Roy | `ananya@example.com` | `ananya123` | **Payout Query** (₹3,570 pending, last payout Oct 2025) |

---

## 🛠️ Quick Start & Installation

### 1. Prerequisites
- Node.js `v18.x` or higher
- NPM `v9.x` or higher
- MongoDB Atlas Connection String

### 2. Environment Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure environment variables in `.env.local`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bookleafadmin?appName=UMS
JWT_SECRET=your_secure_jwt_secret_key_2026
AI_API_KEY=your_ai_api_key_or_mock
AI_MODEL=gpt-4o-mini
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed Database (10 Authors, 18 Books, Knowledge Base & Sample Tickets)
The seed script uses safe upserts to allow repeated execution without duplicate key errors:
```bash
npm run seed
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 API Documentation & Endpoints

### 🔐 Authentication API
- `POST /api/auth/login`: Authenticate email/password, issue HTTP-Only JWT cookie `auth-token`.
- `POST /api/auth/logout`: Clear authentication cookie.
- `GET /api/auth/me`: Get current authenticated user payload.

### 📚 Books API
- `GET /api/books`: List books (Authors receive ONLY their own books; Admins receive all books).
- `GET /api/books/:id`: Get single book details (Enforces authorization).

### 🎟️ Support Tickets API
- `GET /api/tickets`: List tickets (Author filtered).
- `POST /api/tickets`: Create support ticket (DB-first saving + AI classification & draft reply).
- `GET /api/tickets/:id`: Get ticket details (Hides internal notes for author users).
- `PATCH /api/tickets/:id`: Update ticket (Authors can update status; Admins can update status, category, priority, assignment).

### 💬 Messages & Internal Notes API
- `GET /api/tickets/:id/messages`: Get ticket conversation thread.
- `POST /api/tickets/:id/messages`: Post message in ticket conversation (Triggers auto-status updates).
- `GET /api/tickets/:id/notes`: **Admin Only** - Get confidential internal notes.
- `POST /api/tickets/:id/notes`: **Admin Only** - Add confidential internal note.

### 🤖 AI Service API
- `POST /api/tickets/:id/classify`: Trigger AI ticket category & priority classification.
- `POST /api/tickets/:id/draft-reply`: Trigger AI draft support response generation.

### 👑 Admin API
- `GET /api/admin/tickets`: Admin ticket queue with statistics, search, filters (`status`, `category`, `priority`), and sorting (`newest`, `oldest`, `critical_first`, `high_first`).
- `GET /api/users`: Admin list of users and authors.

---

## 🧠 AI Workflow & Resiliency Design

```text
Ticket Submitted (Saved to MongoDB)
               │
               ▼
   Small Classification Prompt (Subject + Description)
               │
               ▼
   Extracted Category & Priority Validation
               │
               ▼
   Load Category KB Section (e.g., knowledge-base/royalty.md)
               │
               ▼
   Generate Empathetic, Data-Informed Support Reply
               │
               ▼
   Admin Workspace Review → Edit / Insert Draft → Send
```

### Handling Royalty Edge Cases in AI Replies:
1. **₹850 Pending Royalty (Kavita)**: Explains the ₹1,000 payout threshold and automatic rollover policy without incorrectly marking it as overdue.
2. **Overdue Royalty > ₹1,000 (Arjun)**: Acknowledges delay, escalates request to Finance Desk, and provides a clear 48-hour follow-up window.
3. **Zero Pending (₹0)**: Explains that all calculated royalties to date have been fully disbursed.
4. **Draft Books (`BK013`, `BK015`)**: Safely handles null MRP, sales, and publication dates without UI crashes.

---

## ☁️ Production Deployment (Vercel & MongoDB Atlas)

1. **MongoDB Atlas**: Ensure your Atlas cluster IP Access List includes `0.0.0.0/0` (allow all) for Vercel serverless deployment.
2. **Vercel Setup**: Connect your repository to Vercel. Set `MONGODB_URI`, `JWT_SECRET`, `AI_API_KEY`, and `AI_MODEL` in Vercel Environment Variables.
3. **Pre-Seeded Production Database**: Run `npm run seed` against your production Atlas URI before launch.
