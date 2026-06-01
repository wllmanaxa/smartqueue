# Smart Queue Management — Backend

Enterprise-style **ASP.NET Core 8 Web API** backend for multi-branch, multi-service queueing with **PostgreSQL**, **JWT + refresh tokens**, **SignalR** real-time updates, **Swagger**, **FluentValidation**, **AutoMapper**, **API versioning**, **rate limiting**, **soft delete**, **audit HTTP logging**, and **reporting**.

## Security (read first)

- **Do not commit production secrets.** Configure the database and JWT key via **environment variables** or **.NET User Secrets** (`dotnet user-secrets`).
- If a database password was ever pasted into a chat or committed to git, **rotate it immediately** in your provider (e.g. Neon) and update your app configuration.

Suggested environment variables:

- `ConnectionStrings__DefaultConnection` — PostgreSQL connection string  
- `Jwt__Key` — long random signing key (≥ 32 characters)

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- PostgreSQL (local or hosted, e.g. Neon)

## Configuration

The API uses **Neon PostgreSQL** via `ConnectionStrings:DefaultConnection` in `appsettings.json` (SSL required). `Program.cs` registers `ApplicationDbContext` with **Npgsql** and applies migrations on startup.

For production, override secrets with environment variables or User Secrets instead of committing passwords:

```bash
cd Backend
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<your-connection-string>"
dotnet user-secrets set "Jwt:Key" "YOUR_LONG_RANDOM_SIGNING_KEY_AT_LEAST_32_CHARS"
```

## Database migrations

From the `Backend` directory (uses `appsettings.json` → Neon):

```bash
dotnet ef database update
```

If you see a message that **dotnet-ef** is older than the runtime, update the global tool (optional):

```bash
dotnet tool update --global dotnet-ef
```

Create a new migration after model changes:

```bash
dotnet ef migrations add <Name> --project Backend.csproj --output-dir Migrations
```

## Run the API

```bash
cd Backend
dotnet run
```

- HTTPS (see `Properties/launchSettings.json` for ports)  
- Swagger UI: `/swagger`  
- Health: `GET /health`  
- SignalR hub: `/hubs/queue` (pass JWT as query `access_token` for browser clients)

## Docker

From `Backend` (where `docker-compose.yml` lives):

```bash
docker compose up --build
```

API listens on **http://localhost:8080** and connects to Neon PostgreSQL (see `docker-compose.yml`).

## Default seed users (Development)

After the first migration + seed:

| Username   | Password        | Role          |
|-----------|-----------------|---------------|
| admin     | Admin@123       | Admin         |
| reception | Reception@123   | Receptionist  |
| staff1    | Staff@123       | Staff         |

Change these in production (remove or replace seed logic).

## API shape

Responses follow:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { }
}
```

Base route pattern: `api/v1.0/<Controller>` (see Swagger).

### Quick API checks (curl)

Replace `BASE` and token as needed.

```bash
BASE=https://localhost:7159

curl -sk -X POST "$BASE/api/v1.0/Auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"userName\":\"admin\",\"password\":\"Admin@123\"}"
```

Use `accessToken` from the response:

```bash
TOKEN=<paste_access_token>

curl -sk "$BASE/api/v1.0/Branches?pageNumber=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN"
```

Create a ticket (authenticated customer/staff/admin/receptionist):

```bash
curl -sk -X POST "$BASE/api/v1.0/Tickets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"branchId\":\"...\",\"serviceId\":\"...\",\"priority\":\"Normal\"}"
```

## Architecture (within this project)

- **Controllers** — HTTP layer, auth policies, versioning  
- **Services** — business logic  
- **Repositories + Unit of Work** — data access abstraction  
- **DTOs** — API contracts  
- **Models + EF configurations** — persistence  
- **Validators** — FluentValidation rules  
- **Middleware** — global exception handling + HTTP audit trail  
- **Hubs** — SignalR real-time branch updates  

## Modules

Authentication, users, branches, services, counters, tickets (create / call / complete / skip / cancel), queue logs, notifications, audit logs, reports (daily, peak hours, staff performance, queue & branch statistics), priority handling, QR ticket payload + PNG data URL, estimated wait for waiting tickets.

## Roles

`Admin`, `Staff`, `Receptionist`, `Customer` — enforced via JWT role claims and `[Authorize]` / policies (`StaffDesk`, `AdminOnly`).

## License

Use and modify freely for your organization.
