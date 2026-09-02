# Feedback App — Complete Flow & Authentication Notes

A **Next.js 14 (App Router)** application that lets users receive **anonymous feedback/messages** on a public profile link (similar to NGL / Qooh.me). Anyone can send an anonymous message (with optional image/video attachments) to a user via `/u/<username>`, and the owner reads them on their dashboard.

---

## 1. Tech Stack

| Concern | Technology |
|---|---|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Auth | **NextAuth (Auth.js) v4** — Credentials + Google OAuth |
| Database | MongoDB via **Mongoose** |
| Validation | **Zod** (schemas) + React Hook Form |
| Styling / UI | Tailwind CSS + shadcn/ui (Radix primitives) |
| State (client) | **Redux Toolkit** (`textAreaSlice`) |
| Email | **Resend** + React Email templates (verification OTP) |
| File storage | **AWS S3** with **pre-signed URLs** |
| Password hashing | **bcryptjs** |

---

## 2. Project Structure (key files)

```
src/
├── app/
│   ├── (auth)/                     # Auth route group (public)
│   │   ├── sign-in/page.tsx
│   │   ├── sign-Up/page.tsx
│   │   └── verify/[username]/page.tsx   # OTP verification
│   ├── (app)/                      # Main app route group (protected)
│   │   ├── page.tsx                # Landing / home
│   │   ├── dashboard/page.tsx      # Owner reads messages
│   │   └── StoreProvider.tsx       # Redux provider
│   ├── u/[username]/page.tsx       # PUBLIC page to send anonymous message
│   └── api/
│       ├── auth/[...nextauth]/route.ts   # NextAuth handler
│       ├── signUp/route.ts               # Register + send OTP
│       ├── verifycode/route.ts           # Verify OTP
│       ├── check-username-unique/route.ts
│       ├── send-message/route.ts         # Public: store a message
│       ├── get-messages/route.ts         # Owner: aggregate messages
│       ├── accept-messages/route.ts      # Toggle "accepting messages"
│       ├── delete-message/[messageId]/route.ts
│       ├── presigned-url/route.ts        # S3 upload/download URLs
│       └── delete-object/[key]/route.ts  # Delete S3 object
├── lib/
│   ├── options.ts                  # NextAuth config (THE auth brain)
│   ├── dbConnect.ts                # Cached Mongo connection
│   └── store.ts / hooks.ts         # Redux
├── model/User.ts                   # Mongoose models + discriminators
├── middleware.ts                   # Route protection
├── schemas/                        # Zod schemas
└── context/AuthProvider.tsx        # <SessionProvider> wrapper
```

---

## 3. Data Model (`src/model/User.ts`)

Uses **Mongoose discriminators** — one physical `users` collection, two logical sub-types distinguished by the `authType` key:

- **Base `UserModel`** — common fields: `username`, `useremail`, `isVerified`, `isAcceptingMessages`, `messages[]`.
- **`CredUserModel`** (`authType: "credential"`) — adds `password`, `verifyCode`, `verifyCodeExpiry`. For email/password sign-ups.
- **`OauthUserModel`** (`authType: "oauth"`) — no extra fields. For Google sign-ins (no password, always verified).

Each `Message` is a sub-document: `{ content, mediaPath, createdAt }`. `mediaPath` is a comma-joined list of S3 object keys.

> Why discriminators? So Google users (who have no password) and credential users live in the same collection and can be queried together via `UserModel`, while still enforcing password requirements only on credential users.

---

## 4. End-to-End App Flow

### A. Sign-up (Credentials)
1. User submits username/email/password on `/sign-Up`. Username availability is checked live via `GET /api/check-username-unique` (Zod-validated).
2. `POST /api/signUp`:
   - Generates a 6-digit **OTP** and a 1-hour expiry.
   - Handles edge cases: existing-verified email/username → `409`; existing-**unverified** → treated as a password reset (re-hash + new OTP); email already used via Google → `409`.
   - Otherwise creates a new `CredUserModel` with `isVerified: false`.
   - Sends the OTP by email via **Resend** (`sendverificationemail`).
3. User is redirected to `/verify/<username>` and enters the OTP.
4. `POST /api/verifycode` checks the code + expiry, sets `isVerified: true`.

### B. Sign-in
- **Credentials:** NextAuth `CredentialsProvider.authorize()` looks up the user by email *or* username, blocks unverified accounts, and `bcrypt.compare`s the password.
- **Google:** `GoogleProvider` handles the OAuth handshake; user record is created/linked inside the `jwt` callback (see §5).

### C. Dashboard (owner, protected)
- `GET /api/get-messages` uses a **MongoDB aggregation pipeline** (`$match → $unwind → $sort → $group`) to return the owner's messages newest-first.
- Toggle "accept messages" → `POST /api/accept-messages` flips `isAcceptingMessages`; `GET` reads it. Both use `getServerSession(authOptions)` to authenticate.
- Delete a message → `DELETE /api/delete-message/<messageId>`.

### D. Public message page (`/u/<username>`) — anonymous, no login
1. Sender types a message; optionally drags/drops up to **4 files** (≤40 MB total, images/videos only).
2. For each file: client requests `GET /api/presigned-url?file=...&type=...` → server returns an S3 **PUT** pre-signed URL (to upload) and a **GET** pre-signed URL (to preview). Client uploads the file straight to S3.
3. `POST /api/send-message` stores `{ content, mediaPath: "key1,key2", createdAt }` into the target user's `messages[]` — **only if** `isAcceptingMessages` is true.

### E. Media storage (S3)
- Files never pass through message payloads — only their **S3 keys** are stored. Uploads/downloads use time-limited **pre-signed URLs**, so the bucket stays private and no AWS credentials reach the browser.
- Keys are namespaced `images/...` or `videos/...` by file extension.

---

## 5. Authentication — Deep Dive

### What I used
- **NextAuth (Auth.js) v4** as the auth layer, configured entirely in `src/lib/options.ts` and mounted at `src/app/api/auth/[...nextauth]/route.ts`.
- **Session strategy: JWT** (`session: { strategy: "jwt", maxAge: 30 days }`) — sessions are **not** stored in the DB; the whole session lives in an encrypted cookie.
- **Two providers:**
  1. `CredentialsProvider` — custom email-or-username + password login, verified with bcrypt.
  2. `GoogleProvider` — OAuth 2.0 login with Google.
- Signed with `NEXTAUTH_SECRET` (encrypts the JWT). Custom pages: `signIn: "/sign-in"`.

### What is OAuth (and OAuth 2.0)?
**OAuth 2.0** is an *authorization* framework that lets a user grant one app limited access to their account on another service **without sharing their password**. In this app it's used for **social login** ("Sign in with Google"), i.e. OAuth used for authentication.

The **Authorization Code flow** used here, step by step:
1. User clicks "Sign in with Google". NextAuth redirects the browser to Google's consent screen with the app's `GOOGLE_CLIENT_ID` and a `redirect_uri`.
2. User logs into Google and consents. Google redirects back to the app's callback (`/api/auth/callback/google`) with a short-lived **authorization code**.
3. NextAuth (server-side) exchanges that code + `GOOGLE_CLIENT_SECRET` for Google's **access token** (and profile info) — this happens back-channel, the secret never touches the browser.
4. NextAuth reads the Google profile (name, email, picture) and hands it to our callbacks, where we create/link the user and issue our own session JWT.

Key OAuth terms:
- **Client ID / Client Secret** — public + private credentials identifying *our app* to Google.
- **Authorization code** — a one-time code Google gives the browser; exchanged server-side for a token.
- **Access token** — proves Google authorized us to read the user's basic profile.
- **Scopes** — what we're allowed to access (default: profile + email).
- **Redirect URI** — the pre-registered callback Google is allowed to send the user back to.

> OAuth vs. Credentials: with Google (OAuth) we never see or store the user's password — Google vouches for their identity. With the Credentials provider we manage the password ourselves (hashed with bcrypt) and verify identity with an emailed OTP.

### The callbacks (the important glue) — `src/lib/options.ts`
Because we use JWT sessions, two callbacks shape what ends up in the cookie and the client session:

**`jwt({ token, user, account })`** — runs at sign-in and whenever the session is read.
- On first sign-in, `user` exists → we copy custom fields into the token: `_id`, `isVerified`, `isAcceptingMessages`, `username`.
- If the provider is **Google** (`account.provider === "google"`), we hit the DB:
  - If a **verified** user with that email already exists → link to it (prevents duplicate accounts when someone who signed up with credentials later uses Google).
  - Otherwise create a new `OauthUserModel` (`isVerified: true`, using Google's name/email).
  - Then copy that DB user's fields into the token.

**`session({ session, token })`** — runs whenever the client calls `useSession()` / `getSession()` / `getServerSession()`.
- Copies the custom fields from the token onto `session.user` so the whole app can read `_id`, `username`, `isVerified`, `isAcceptingMessages`.

> Order matters: `jwt()` always runs **before** `session()`, so anything stashed in the token is immediately available to the session callback. TypeScript typings for these extra fields live in `src/types/next-auth.d.ts`.

### Session availability on the client
`src/context/AuthProvider.tsx` wraps the app in NextAuth's `<SessionProvider>`, so any client component can call `useSession()`. Server routes read the session with `getServerSession(authOptions)`.

### Route protection — `src/middleware.ts`
Uses `getToken()` (reads the JWT from the request cookie) to gate routes via the `matcher` config:
- **Logged-in** users hitting `/`, `/sign-in`, `/sign-Up`, or `/verify/*` → redirected to `/dashboard`.
- **Logged-out** users hitting `/dashboard*` → redirected to `/sign-in`.
- Everything else passes through.

---

## 6. Security Notes / Highlights
- Passwords hashed with **bcrypt** (salt rounds 10); plaintext never stored.
- Email ownership proven via **time-limited OTP** (1-hour expiry) before an account can log in.
- Unverified credential accounts are blocked at login and can "reclaim" their pending record by re-signing-up (password reset path).
- **JWT session** signed/encrypted with `NEXTAUTH_SECRET`; no server-side session store.
- S3 stays **private** — browser only ever gets short-lived pre-signed URLs; AWS keys stay on the server.
- Server API routes independently re-check auth with `getServerSession` (defense in depth, not relying on middleware alone).

---

## 7. Environment Variables (required)
```
MONGODB_URI            # MongoDB connection string
NEXTAUTH_SECRET        # JWT signing/encryption secret
GOOGLE_CLIENT_ID       # Google OAuth client id
GOOGLE_CLIENT_SECRET   # Google OAuth client secret
RESEND_API_KEY         # Resend (verification emails)
S3_REGION
S3_ACCESS_KEY
S3_SECRET_KEY
S3_BUCKET_NAME
```

---

## 8. Quick Request → Handler Map
| Action | Endpoint | Auth |
|---|---|---|
| Register + send OTP | `POST /api/signUp` | public |
| Verify OTP | `POST /api/verifycode` | public |
| Check username | `GET /api/check-username-unique` | public |
| Sign in | via `/api/auth/[...nextauth]` | public |
| Send anonymous message | `POST /api/send-message` | public |
| Get pre-signed S3 URLs | `GET /api/presigned-url` | public |
| Read my messages | `GET /api/get-messages` | session |
| Toggle accepting | `GET/POST /api/accept-messages` | session |
| Delete a message | `DELETE /api/delete-message/[id]` | session |
| Delete an S3 object | `DELETE /api/delete-object/[key]` | session |
```
