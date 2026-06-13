# 1-Day Blog App Build Plan (Backend First, Then Frontend)

## Goal
Ship a usable MVP in one day:
- Auth (register/login)
- Create and publish posts
- Public feed and post details
- Basic frontend for reading and writing posts

## Scope Guardrails (Critical for 1 Day)
- Keep roles simple: `author` and `reader` (or skip roles and use authenticated vs public)
- Skip advanced features for now: likes, bookmarks, image upload, rich text editor, nested comments
- Keep UI minimal and clean
- Use one database (SQLite for speed or Postgres if already ready)

## Deliverables by End of Day
- Working backend API with docs or endpoint list
- Working frontend connected to backend
- End-to-end flow: register/login -> create post -> publish -> view publicly
- Code pushed to main branch (or feature branch + PR)

## Hour-by-Hour Plan

## 0. Prep (30 minutes)
1. Confirm repo shape:
   - Parent project folder should contain backend and frontend folders.
2. Verify backend starts locally.
3. Create frontend app folder (if not already created).
4. Set environment files for backend and frontend.

Exit criteria:
- Both backend and frontend projects run locally.

## 1. Backend Foundation (1.5 hours)
1. Create/confirm modules:
   - auth
   - users
   - posts
2. Add database models/entities:
   - User: id, email, username, passwordHash, createdAt
   - Post: id, title, slug, excerpt, content, status(draft|published), publishedAt, authorId, createdAt
3. Add DTO validation for all write endpoints.
4. Add global validation and consistent error responses.

Exit criteria:
- Schema/migrations are ready.
- API boots with no runtime errors.

## 2. Auth APIs (1.5 hours)
1. Implement endpoints:
   - POST /auth/register
   - POST /auth/login
   - GET /auth/me (protected)
2. Add password hashing.
3. Add JWT auth guard.

Exit criteria:
- Can register and login.
- Protected route works with token.

## 3. Posts APIs (2 hours)
1. Implement author endpoints (protected):
   - POST /posts (create draft)
   - PATCH /posts/:id (edit own post)
   - PATCH /posts/:id/publish
2. Implement public endpoints:
   - GET /posts (published only, pagination)
   - GET /posts/:slug (published only)
3. Add ownership checks for edits/publish.

Exit criteria:
- Authenticated user can create/publish.
- Public users can browse/read published posts.

## 4. Backend Smoke Test + Seed Data (45 minutes)
1. Add simple seed script or create sample data manually.
2. Test with Postman/Thunder Client:
   - register/login
   - create draft
   - publish
   - fetch public feed
3. Fix only blockers.

Exit criteria:
- Main user journey works 100% in backend.

## 5. Frontend Scaffold + Routing (45 minutes)
1. Create pages:
   - Login/Register
   - Home (post list)
   - Post details
   - New post
   - My posts (optional if time)
2. Set up API client and base URL.
3. Add route guards for write pages.

Exit criteria:
- Navigation works; pages render.

## 6. Frontend Feature Wiring (2 hours)
1. Auth UI:
   - login/register forms
   - store token safely for MVP (localStorage acceptable for day-1 MVP)
2. Posts UI:
   - list published posts
   - view single post
   - create new post
   - publish action
3. Add loading and error states.

Exit criteria:
- End-to-end user flow works from UI.

## 7. Final QA + Git Hygiene (30 minutes)
1. Test core journey once more from clean browser session.
2. Confirm no secrets committed.
3. Run lint/tests if available (at least smoke run).
4. Commit with clear message.

Exit criteria:
- Demo-ready MVP is stable.

## API Checklist (MVP)
- POST /auth/register
- POST /auth/login
- GET /auth/me
- POST /posts
- PATCH /posts/:id
- PATCH /posts/:id/publish
- GET /posts?page=1&limit=10
- GET /posts/:slug

## Frontend Checklist (MVP)
- Auth screens (register/login)
- Public home page with post cards
- Post details page
- New post form
- Publish action button

## Contingency Rules (If Running Behind)
1. Drop comments entirely.
2. Skip refresh tokens (keep access token only for day 1).
3. Skip edit post, keep create + publish only.
4. Skip My Posts page.

## Suggested Command Milestones
1. Backend milestones:
   - run migration
   - start API
   - test endpoints
2. Frontend milestones:
   - create app
   - add routes
   - integrate API calls
   - test publish flow

## Definition of Done (Today)
- A new user can register and login.
- User can create a draft and publish a post.
- Anyone can view published posts on the frontend.
- Project is committed and runnable locally with clear setup instructions.
