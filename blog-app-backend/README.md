# ScribePoint API

A full-featured blog platform REST API built with **NestJS**, **Prisma**, and **PostgreSQL**. Supports email/password and Google OAuth authentication, role-based access control, image uploads via Cloudinary, full-text search, newsletter subscriptions, and automated transactional emails.

---

## Tech Stack

| Layer            | Technology                                           |
| ---------------- | ---------------------------------------------------- |
| Framework        | NestJS 11                                            |
| Language         | TypeScript                                           |
| ORM              | Prisma 7                                             |
| Database         | PostgreSQL                                           |
| Auth             | JWT (access + refresh tokens), Passport              |
| OAuth            | Google OAuth 2.0 (passport-google-oauth20)           |
| Password hashing | Argon2                                               |
| Email            | Resend                                               |
| Image storage    | Cloudinary                                           |
| In-memory store  | Custom in-memory store (brute-force & rate-limiting) |
| Rate limiting    | @nestjs/throttler                                    |
| Validation       | class-validator, class-transformer, Zod              |
| Env validation   | @t3-oss/env-core + Zod                               |
| Job scheduling   | @nestjs/schedule                                     |
| API Docs         | Swagger / OpenAPI (`/docs`)                          |

---

## Features

- **Auth** — register, email OTP verification, login, logout, Google OAuth, forgot/reset password, access + refresh token rotation
- **Posts** — create/update/delete/publish draft posts, list published posts, slug-based public access, cover image upload, categories, and tags
- **Comments** — comments on published posts; authors and post owners can delete their own
- **Categories & Tags** — managed independently, associated with posts via many-to-many
- **Search** — full-text search across title, slug, excerpt, and content; filterable by category or tag; paginated
- **Uploads** — authenticated image uploads to Cloudinary (`content`, `avatar`, or `general` contexts); 5 MB limit; JPEG/PNG/WebP/AVIF/GIF supported
- **Newsletter** — public email subscription with duplicate prevention
- **Role-based access control** — `admin` and `user` roles enforced via guards and decorators
- **Soft deletes** — users, posts, and comments use `deletedAt` instead of hard deletes
- **Global validation pipe** — whitelist mode, forbids unknown properties
- **CORS** — configurable allowed origins via environment variable

---

## Getting Started

### Prerequisites

- Node.js >= 20
- PostgreSQL database
- A [Cloudinary](https://cloudinary.com) account
- A [Resend](https://resend.com) account
- A Google OAuth 2.0 app ([console.cloud.google.com](https://console.cloud.google.com))

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Copy `.env.example` to `.env` and fill in the values.

```bash
cp .env.example .env
```

### 3. Run database migrations

```bash
npx prisma migrate deploy
```

### 4. Run in development

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
│   ├── decorators/        # @CurrentUser, @Public, @Roles
│   ├── guards/            # RolesGuard
│   └── redis/             # Redis module and service
├── config/
│   └── env.ts             # Zod-validated environment config
├── modules/
│   ├── auth/              # Registration, login, JWT, OTP, Google OAuth, password reset
│   ├── categories/        # Post categories (CRUD)
│   ├── cloudinary/        # Cloudinary client wrapper
│   ├── comments/          # Post comments (nested under /posts/:postId/comments)
│   ├── mail/              # Transactional email via Resend
│   ├── newsletter/        # Newsletter subscriptions
│   ├── posts/             # Blog posts with publish/unpublish workflow
│   ├── queue/             # Background job queue
│   ├── rate-limiter/      # Rate limiting helpers
│   ├── search/            # Full-text post search
│   ├── tags/              # Post tags (CRUD)
│   ├── uploads/           # Image upload to Cloudinary
│   └── users/             # User profile management
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts
prisma/
├── schema.prisma          # Data models
└── migrations/            # Migration history
```

---

## API Overview

Full interactive documentation is available at **`http://localhost:3000/docs`** when the server is running.

| Module     | Base path                 | Public endpoints                                                             | Requires auth                    |
| ---------- | ------------------------- | ---------------------------------------------------------------------------- | -------------------------------- |
| Auth       | `/auth`                   | register, verify-otp, resend-otp, login, forgot/reset password, Google OAuth | refresh, logout                  |
| Posts      | `/posts`                  | list published, get by slug                                                  | create, update, delete, my posts |
| Comments   | `/posts/:postId/comments` | list comments                                                                | create, delete                   |
| Categories | `/categories`             | list                                                                         | create, update, delete           |
| Tags       | `/tags`                   | list                                                                         | create, update, delete           |
| Search     | `/search`                 | search posts, list categories, list tags                                     | —                                |
| Uploads    | `/uploads`                | —                                                                            | upload image                     |
| Newsletter | `/newsletter`             | subscribe                                                                    | —                                |
| Users      | `/users`                  | —                                                                            | get/update own profile           |

### Authentication flow

1. `POST /auth/register` — creates account and sends OTP to email
2. `POST /auth/verify-otp` — verifies OTP, account becomes active
3. `POST /auth/login` — returns `accessToken`; sets `refreshToken` as an **httpOnly cookie**
4. Include `Authorization: Bearer <accessToken>` on protected requests
5. `POST /auth/refresh` — issues a new token pair when the access token expires (cookie sent automatically)

---

## Data Model

```
User ─< Post ─< Comment
         │
         ├── Category
         └─< PostTag >─ Tag

User ─< RefreshToken
User ─< ResetPassword
NewsletterSubscriber
```

| Model                    | Notes                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------ |
| **User**                 | Email/password or Google auth; OTP verification; `admin` \| `user` role; soft-delete |
| **Post**                 | Title, slug, content, excerpt, cover image, publish status; soft-delete              |
| **Category**             | Optional post grouping                                                               |
| **Tag / PostTag**        | Many-to-many post tagging                                                            |
| **Comment**              | Nested under posts; soft-delete                                                      |
| **RefreshToken**         | Hashed token storage                                                                 |
| **ResetPassword**        | Password reset token lifecycle                                                       |
| **NewsletterSubscriber** | Email-only subscriber list                                                           |

---

## Deployment

The API is live at **[https://scribepoint.onrender.com](https://scribepoint.onrender.com)**.

Swagger documentation is available at [https://scribepoint.onrender.com/docs](https://scribepoint.onrender.com/docs).

## Contributors

Built collaboratively by:

- **Adeyoola Adebayo** — Backend · [GitHub](https://github.com/MyITjournal)
- **Adewumi Josephine Adedoyinsola** — Frontend · (https://josseycodes-portfolio.vercel.app/)
