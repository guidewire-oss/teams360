# Local setup :
### Prerequisites

- **Node.js 18+** (for frontend)
- **Go 1.25+** (for backend)
- **PostgreSQL 14+** (for database)
- **Docker** (recommended, for running PostgreSQL)

### One-Command Setup

The easiest way to run Team Health Check locally:

```bash
git clone https://github.com/guidewire-oss/teams360.git
cd teams360
make run
```

This single command will:
1. Install all dependencies (if not already installed)
2. Start PostgreSQL in Docker (if Docker is available)
3. Run database migrations automatically
4. Start both frontend and backend servers
5. Display demo credentials for login

**That's it!** Open http://localhost:3000 in your browser.

### Manual Setup (Alternative)

If you prefer manual control or don't have Docker:

#### 1. Clone the Repository

```bash
git clone https://github.com/guidewire-oss/teams360.git
cd teams360
```

#### 2. Start PostgreSQL Database

Using Docker (recommended):
```bash
docker run -d \
  --name teams360-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=teams360 \
  -p 5432:5432 \
  postgres:16-alpine
```

Or use an existing PostgreSQL instance and set the connection string.

#### 3. Start the Backend

```bash
cd backend

# Set database connection
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/teams360?sslmode=disable"

# Install dependencies and run
go mod download
go run cmd/api/main.go
```

The API server will start at http://localhost:8080

#### 4. Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at http://localhost:3000

### 5. Login and Explore

Use these demo credentials to explore different user roles:

| Role | Username | Password | Dashboard |
|------|----------|----------|-----------|
| Vice President | `vp` | `demo` | /manager |
| Director | `director1` | `demo` | /manager |
| Manager | `manager1` | `demo` | /manager |
| Team Lead | `teamlead1` | `demo` | /dashboard |
| Team Member | `demo` | `demo` | /home |
| Administrator | `admin` | `admin` | /admin |

### Running Services Separately

**Frontend:**
```bash
cd frontend
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Run linter
```

**Backend:**
```bash
cd backend
go run cmd/api/main.go    # Start server
ginkgo -r ./...           # Run Ginkgo tests
```

## Configuration

### Environment Variables

**Frontend** (`frontend/.env.local`):
```env
# Backend port (must match PORT set for the backend)
NEXT_PUBLIC_API_URL=http://localhost:8080

# SSO / OIDC (optional — omit these to disable SSO and use username/password only)
NEXT_PUBLIC_OAUTH_CLIENT_ID=your-client-id
NEXT_PUBLIC_OAUTH_AUTHORIZE_URL=https://your-provider.com/oauth/authorize
NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_OAUTH_SCOPES=openid email profile   # optional, this is the default
```

**Backend** (`backend/.env`):
```env
PORT=8080
DATABASE_URL=postgres://postgres:postgres@localhost:5432/teams360?sslmode=disable
GIN_MODE=debug  # or "release" for production

# SSO / OIDC (optional — must be set if frontend SSO vars are set)
OAUTH_CLIENT_ID=your-client-id
OAUTH_TOKEN_URL=https://your-provider.com/oauth/token
OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
```

### Configuring SSO (OIDC / OAuth 2.0)

Team Health Check supports single sign-on via any OIDC-compliant provider (Keycloak, Okta, Auth0, Google, Azure AD, etc.) using the **Authorization Code + PKCE** flow. Username/password login continues to work alongside SSO.

#### How it works

1. Register Team Health Check as a **Single Page Application (public client)** in your provider — no client secret is needed.
2. Add `http://localhost:3000/auth/callback` (or your production URL) as an allowed redirect URI.
3. Set the environment variables listed above in both `frontend/.env.local` and `backend/.env`.
4. Restart both servers. A **Sign in with SSO** button will appear on the login page.

When a user signs in via SSO, Team Health Check extracts their `email` from the provider's ID token and looks up the matching user in the database. The user must already exist — Team Health Check does not auto-create accounts from SSO logins.

#### Provider setup quick reference

| Setting | Value |
|---------|-------|
| Application type | Single Page App (SPA) / Public client |
| Client secret | Not required (PKCE flow) |
| Allowed redirect URI | `http://localhost:3000/auth/callback` |
| Required scopes | `openid email profile` |
| Token claim needed | `email` (in ID token or access token) |

#### Loading env vars before starting

```bash
# Source backend vars (exports them so child processes inherit them)
set -a && source backend/.env && set +a
make run
```

## Troubleshooting

### Mac ARM64 (Apple Silicon) Issues

If you encounter SWC-related errors:

```bash
npm cache clean --force
rm -rf node_modules package-lock.json .next
npm install
npm install --force @next/swc-darwin-arm64
```

### Database Connection Issues

Ensure PostgreSQL is running and accessible:

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Test connection
psql "postgres://postgres:postgres@localhost:5432/teams360?sslmode=disable" -c "SELECT 1"
```

### Port Already in Use

```bash
# Kill processes on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Kill processes on port 8080 (backend)
lsof -ti:8080 | xargs kill -9
```
