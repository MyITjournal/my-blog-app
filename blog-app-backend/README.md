# Blog App — Backend

A RESTful blog API built with **NestJS 11**, **Prisma 6**, and **PostgreSQL** (development). Supports full authentication, posts with tags and categories, comments, and public author profiles.

---

## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Framework      | NestJS 11                           |
| ORM            | Prisma 6                            |
| Database       | PostgreSQL (dev)                    |
| Auth           | JWT + httpOnly refresh token cookie |
| OAuth          | Google OAuth 2.0                    |
| Validation     | class-validator + class-transformer |
| Env Validation | @t3-oss/env-core + zod              |
| Rate Limiting  | @nestjs/throttler                   |
| API Docs       | Swagger (`/docs`)                   |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Generate Prisma client

```bash
npx prisma generate
```

### 3. Push schema to database

```bash
npx prisma db push
```

### 4. Set environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required variables:

```env
# App
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# JWT — secrets must be at least 32 characters
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d
JWT_RESET_SECRET=your-reset-secret-min-32-chars

# Google OAuth
# Create credentials at https://console.cloud.google.com/apis/credentials
CLIENT_ID=your-google-client-id.apps.googleusercontent.com
CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Cookies — leave empty in development
COOKIE_DOMAIN=

# Swagger
SWAGGER_ENABLED=true
```

> **Note:** Environment variables are validated on startup with `zod`. The app will refuse to start if any required variable is missing or invalid (e.g. JWT secrets shorter than 32 characters).

### 5. Run in development

```bash
npm run start:dev
```

The server starts at `http://localhost:3000`.  
Swagger UI is available at `http://localhost:3000/docs`.

---

## Available Scripts

```bash
# Development (watch mode)
npm run start:dev

# Production build
npm run build
npm run start:prod

# Unit tests
npm run test

# Unit tests (watch)
npm run test:watch

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov

# Lint
npm run lint
```

---

## Project Structure

```
src/
├── common/
│   ├── decorators/        # @CurrentUser, @Public
│   └── redis/             # In-memory Redis-compatible service
├── config/
│   └── env.ts             # Typed + validated environment config (zod)
├── modules/
│   ├── auth/              # Registration, login, JWT, OTP, Google OAuth
│   ├── categories/        # Post categories (CRUD)
│   ├── comments/          # Post comments (nested under posts)
│   ├── mail/              # Email sending service (stub in development)
│   ├── posts/             # Blog posts with publish/unpublish workflow
│   ├── queue/             # Background job queue
│   ├── rate-limiter/      # Custom rate limiter
│   ├── tags/              # Post tags (CRUD)
│   └── users/             # User management and author profiles
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts
prisma/
├── schema.prisma          # Data models
└── seed.ts                # Local demo data (not committed)
```

---

## API Overview

Full interactive documentation is available at **`http://localhost:3000/docs`** (Swagger UI) when the server is running.

### Module summary

| Module     | Base Path                 | Public Endpoints                         | Auth Required                     |
| ---------- | ------------------------- | ---------------------------------------- | --------------------------------- |
| Auth       | `/auth`                   | register, login, OTP flows, Google OAuth | refresh, logout, me               |
| Posts      | `/posts`                  | list published, get by slug              | create, update, publish, my posts |
| Comments   | `/posts/:postId/comments` | list comments                            | create, delete                    |
| Categories | `/categories`             | list                                     | create                            |
| Tags       | `/tags`                   | list                                     | create                            |
| Users      | `/users`                  | author profile, author posts             | update own profile, admin ops     |

### Authentication

- Login returns an `accessToken` (use in `Authorization: Bearer <token>` header).
- A `refreshToken` is set as an **httpOnly cookie** automatically.
- Call `POST /auth/refresh-token` when the access token expires — the cookie is sent automatically by the browser.

---

## Database

Prisma schema is in `prisma/schema.prisma`. Key models:

- **User** — email/password or Google auth, OTP verification, soft-delete
- **Post** — title, slug, content, excerpt, publish status, soft-delete
- **Category** — optional post category
- **Tag / PostTag** — many-to-many post tagging
- **Comment** — nested under posts, soft-delete
- **RefreshToken** — hashed token storage
- **ResetPassword** — password reset token lifecycle

## Deployment

The API is live at **[https://scribepoint.onrender.com](https://scribepoint.onrender.com)**.

Swagger documentation is available at [https://scribepoint.onrender.com/docs](https://scribepoint.onrender.com/docs).

## License

[MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
