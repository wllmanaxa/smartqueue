# Smart Queue — Production Deployment Guide

This guide prepares deployment to **Render** (API), **Vercel** (frontend), and **Neon** (PostgreSQL). **Do not deploy until you have rotated any secrets that were ever committed or shared.**

| Component | Platform |
|-----------|----------|
| Backend API | [Render](https://render.com) |
| Frontend SPA | [Vercel](https://vercel.com) |
| Database | [Neon](https://neon.tech) |

---

## 1. Prerequisites

- Git repository pushed to GitHub/GitLab
- Neon project with PostgreSQL database
- Render account
- Vercel account
- .NET 8 SDK (local verification only)
- Node.js 20+ (local frontend build test)

---

## 2. Neon (PostgreSQL)

### 2.1 Create database

1. Sign in to [Neon](https://console.neon.tech).
2. Create a project and database (e.g. `smartqueue`).
3. Open **Connection details** → copy the **pooled** connection string (recommended for serverless/PaaS).

### 2.2 Connection string format

```
Host=<host>;Port=5432;Database=<db>;Username=<user>;Password=<password>;SSL Mode=Require;Trust Server Certificate=true
```

### 2.3 Security

- Use a strong password; store only in Render environment variables.
- If a password appeared in git history, **rotate it in Neon** before going live.
- Restrict Neon IP allowlist if your plan supports it (optional).

### 2.4 Migrations

The API runs `dotnet ef` migrations automatically on startup (`Program.cs`). For manual runs locally:

```bash
cd Backend
dotnet ef database update
```

---

## 3. Render (Backend API)

### 3.1 Option A — Blueprint (`render.yaml`)

1. Push this repo to your Git host.
2. Render → **New** → **Blueprint** → connect the repo.
3. Render reads [`render.yaml`](render.yaml) at the repository root.
4. Set **sync: false** variables in the Render dashboard when prompted:
   - `ConnectionStrings__DefaultConnection`
   - `Jwt__Key`
   - `Cors__AllowedOrigins`

### 3.2 Option B — Manual Web Service

| Setting | Value |
|---------|--------|
| **Root Directory** | `Backend` |
| **Runtime** | .NET |
| **Build Command** | `dotnet restore && dotnet publish -c Release -o ./publish` |
| **Start Command** | `dotnet ./publish/Backend.dll` |
| **Health Check Path** | `/health` |

Render sets `PORT` automatically; the API binds to it.

### 3.3 Backend environment variables (Render)

| Variable | Required | Example / notes |
|----------|----------|-----------------|
| `ASPNETCORE_ENVIRONMENT` | Yes | `Production` |
| `ConnectionStrings__DefaultConnection` | Yes | Neon pooled connection string |
| `Jwt__Key` | Yes | ≥ 32 random characters (openssl rand -base64 48) |
| `Jwt__Issuer` | Yes | `SmartQueue` |
| `Jwt__Audience` | Yes | `SmartQueueClients` |
| `Cors__AllowedOrigins` | Recommended | `https://your-app.vercel.app` (comma-separated, no trailing slash) |
| `Cors__AllowVercelPreviews` | No | `true` (default) — allows `*.vercel.app` when explicit origins are not set |
| `Features__EnableSwagger` | No | `false` (recommended) |
| `Jwt__AccessTokenMinutes` | No | `30` |
| `Jwt__RefreshTokenDays` | No | `7` |

**CORS:** After the first Vercel deploy, set `Cors__AllowedOrigins` to your exact Vercel URL(s), including preview URLs if needed:

```
https://smartqueue.vercel.app,https://smartqueue-git-main-you.vercel.app
```

### 3.4 Verify API on Render

Replace `API_URL` with your Render service URL (production: `https://smartqueue-7dxl.onrender.com`).

```bash
curl -s "https://API_URL/health"
```

Expect JSON with `"status":"healthy"` and a `database` check when Neon is reachable.

Login:

```bash
curl -s -X POST "https://API_URL/api/v1.0/Auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"userName\":\"admin\",\"password\":\"Admin@123\"}"
```

> Change default seeded passwords before production use.

---

## 4. Vercel (Frontend)

### 4.1 Import project

1. Vercel → **Add New** → **Project** → import your repo.
2. Set **Root Directory** to `Frontend`.
3. Framework preset: **Vite** (or use [`Frontend/vercel.json`](Frontend/vercel.json)).

### 4.2 Build settings

| Setting | Value |
|---------|--------|
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### 4.3 Frontend environment variables (Vercel)

| Variable | Required | Example |
|----------|----------|---------|
| `VITE_API_BASE_URL` | Yes | `https://smartqueue-7dxl.onrender.com/api/v1.0` (or host only; app appends `/api/v1.0`) |

Optional:

| Variable | When to use |
|----------|-------------|
| `VITE_HUB_BASE_URL` | Only if hub URL differs from API origin (usually omit) |

Apply to **Production** (and Preview if you test preview deployments against the same API).

### 4.4 Redeploy after env changes

Vite embeds `VITE_*` variables at **build time**. After changing `VITE_API_BASE_URL`, trigger a new deployment.

### 4.5 Update Render CORS

Copy the Vercel production URL and add it to Render `Cors__AllowedOrigins`, then redeploy or restart the API service.

---

## 5. Environment variables reference

### Backend (Render)

```
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=<Neon connection string>
Jwt__Key=<64+ char secret>
Jwt__Issuer=SmartQueue
Jwt__Audience=SmartQueueClients
Cors__AllowedOrigins=https://your-app.vercel.app
Features__EnableSwagger=false
```

### Frontend (Vercel)

```
VITE_API_BASE_URL=https://smartqueue-7dxl.onrender.com/api/v1.0
```

### JWT (signing & validation)

| Variable | Purpose |
|----------|---------|
| `Jwt__Key` | HMAC signing key (same on all API instances) |
| `Jwt__Issuer` | Token `iss` claim |
| `Jwt__Audience` | Token `aud` claim |
| `Jwt__AccessTokenMinutes` | Access token lifetime |
| `Jwt__RefreshTokenDays` | Refresh token lifetime |

### PostgreSQL (Neon)

| Variable | Purpose |
|----------|---------|
| `ConnectionStrings__DefaultConnection` | Full Npgsql connection string to Neon |

---

## 6. Production validation checklist

Complete after both services are deployed and env vars are set.

### 6.1 API health

- [ ] `GET https://<render-url>/health` returns `200` and `"status":"healthy"`
- [ ] Health JSON includes `database` check passing

### 6.2 Authentication & JWT

- [ ] Login from Vercel UI with seeded admin (then change password)
- [ ] `POST /api/v1.0/Auth/login` returns `accessToken` and `refreshToken`
- [ ] Authenticated request with `Authorization: Bearer <token>` returns `200`
- [ ] Token refresh works after access token expiry (or force 401 and retry)

### 6.3 CRUD & routes

- [ ] Branches list loads on dashboard
- [ ] Users / tickets / counters pages load data
- [ ] Create/update/delete on at least one resource (e.g. branch or ticket)

### 6.4 CORS

- [ ] Browser Network tab shows no CORS errors on API calls from Vercel origin
- [ ] `OPTIONS` preflight succeeds for authenticated routes

### 6.5 Frontend ↔ backend

- [ ] `VITE_API_BASE_URL` points to Render `/api/v1.0`
- [ ] Dashboard “API health” shows healthy (calls `/health` on API host)
- [ ] Queue monitor SignalR connects (check browser console; hub URL `https://<api>/hubs/queue`)

### 6.6 Security smoke test

- [ ] Swagger disabled in production (`Features__EnableSwagger=false`)
- [ ] No secrets in `appsettings.json` in git
- [ ] Default seed passwords changed or seed disabled for production

---

## 7. Local production-like test (optional)

**Backend:**

```bash
cd Backend
$env:ConnectionStrings__DefaultConnection="<neon-string>"
$env:Jwt__Key="<32+ char secret>"
$env:Cors__AllowedOrigins="http://localhost:5173"
$env:ASPNETCORE_ENVIRONMENT="Production"
dotnet run
```

**Frontend:**

```bash
cd Frontend
$env:VITE_API_BASE_URL="http://localhost:5159/api/v1.0"
npm run build
npm run preview
```

---

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| API won’t start on Render | Missing connection string or JWT key | Set env vars; check Render logs |
| `503` on `/health` | Neon unreachable or wrong connection string | Verify Neon string, SSL, IP allowlist |
| CORS error in browser | `Cors__AllowedOrigins` mismatch | Use exact Vercel URL, no trailing slash |
| Frontend 404 on refresh | SPA routing | `vercel.json` rewrites (included) |
| API calls go to `/Auth/login` (404) | `VITE_API_BASE_URL` missing `/api/v1.0` | Use full base or host only (app normalizes); redeploy |
| API calls go to wrong host | `VITE_API_BASE_URL` not set at build | Set in Vercel or use `Frontend/.env.production`, redeploy |
| SignalR fails | CORS or wrong hub URL | Ensure `getHubBaseUrl()` resolves to Render origin |
| 401 on all routes | Clock skew or wrong JWT key | Same `Jwt__Key` across deploys; check issuer/audience |

---

## 9. Files added for deployment

| File | Purpose |
|------|---------|
| [`render.yaml`](render.yaml) | Render Blueprint |
| [`Backend/appsettings.Production.json`](Backend/appsettings.Production.json) | Production logging & feature flags |
| [`Backend/appsettings.example.json`](Backend/appsettings.example.json) | Template (no secrets) |
| [`Backend/Configuration/CorsSettings.cs`](Backend/Configuration/CorsSettings.cs) | CORS configuration model |
| [`Frontend/vercel.json`](Frontend/vercel.json) | Vercel build & SPA rewrites |
| [`Frontend/.env.example`](Frontend/.env.example) | Local / production env template |

---

## 10. Post-deployment hardening (recommended)

1. Rotate Neon password and JWT signing key if they were ever exposed.
2. Change seeded user passwords (`admin`, `reception`, `staff1`).
3. Disable Swagger in production.
4. Enable Neon backups and monitoring.
5. Consider Render paid plan to avoid cold-start delays on free tier.
