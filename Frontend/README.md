# Smart Queue — Frontend

React + Vite admin dashboard for the Smart Queue Management API.

## Stack

- React 18, Vite 6
- Tailwind CSS (dark/light)
- React Router, Axios, Context API
- Recharts, Framer Motion, React Icons
- SignalR (`@microsoft/signalr`) for queue monitor updates

## Setup

**You must run `npm install` once before `npm run dev`.**  
If you see `'vite' is not recognized`, dependencies are missing.

```powershell
cd D:\smartqueue\Frontend
npm install
npm run dev
```

If install fails, try:

```powershell
npm install --legacy-peer-deps
```

Requires [Node.js](https://nodejs.org/) 18+ (includes npm).

App: **http://localhost:5173**

## API

Default base URL (`.env`):

```
VITE_API_BASE_URL=https://localhost:7159/api/v1.0
```

The backend uses API version **1.0** (`/api/v1.0/...`). Vite proxies `/api` and `/hubs` to the backend during development.

Ensure the backend is running (`dotnet run` in `Backend`) and trust the dev HTTPS certificate if needed.

## Login

Use seeded credentials, e.g. **admin** / **Admin@123**.

## Build

```bash
npm run build
npm run preview
```

## Features

- JWT auth with refresh interceptor
- Protected routes
- Dashboard with charts
- CRUD: branches, services, counters, users
- Tickets: create, call, complete, skip, cancel
- Fullscreen-style queue monitor
- Reports (daily, peak hours, staff, queue stats)
- Settings (theme, password change)
