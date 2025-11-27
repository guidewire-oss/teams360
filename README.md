# Team360 Health Check

An open-source team health assessment platform inspired by [Spotify's Squad Health Check Model](https://engineering.atspotify.com/2014/09/squad-health-check-model/), designed to help organizations systematically improve team well-being and effectiveness.

## What is Team360?

Team360 enables teams to regularly assess their working environment across multiple dimensions (mission clarity, delivery speed, code health, fun, etc.) using a simple red/yellow/green scoring system. The platform aggregates these assessments to help managers and executives identify areas needing support and track improvements over time.

### Core Philosophy

- **Support, Not Surveillance**: Health checks are a support tool, not a performance evaluation mechanism
- **"Red" Means "Needs Support"**: A red score doesn't mean "bad team" - it means "this team needs help in this area"
- **Trust-Based**: The system assumes honest input and encourages transparent self-assessment
- **Actionable Insights**: Focus on building team self-awareness and driving targeted improvements

### Key Features

| Feature | Description |
|---------|-------------|
| **11 Health Dimensions** | Expanded from Spotify's original 8 dimensions to cover more aspects of team health |
| **Hierarchical Organization** | Support for VP → Director → Manager → Team Lead → Team Member reporting chains |
| **Role-Based Dashboards** | Different views for team members, team leads, managers, and executives |
| **Trend Analysis** | Track health metrics over assessment periods (e.g., "2024 - 1st Half") |
| **Visual Analytics** | Radar charts, bar charts, and line graphs for data visualization |
| **Flexible Cadences** | Configure weekly, biweekly, monthly, or quarterly check-ins per team |

## Screenshots

### Team Member Survey
Complete health check surveys with intuitive red/yellow/green selections and optional comments.

### Manager Dashboard
View aggregated health metrics across all supervised teams with trend analysis.

### Team Lead Dashboard
Monitor your team's health with detailed breakdowns and individual response tracking.

## Quick Start

### Prerequisites

- **Node.js 18+** (for frontend)
- **Go 1.21+** (for backend)
- **PostgreSQL 14+** (for database)
- **Docker** (optional, for running PostgreSQL)

### 1. Clone the Repository

```bash
git clone https://github.com/anthropics/teams360.git
cd teams360
```

### 2. Start PostgreSQL Database

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

### 3. Start the Backend

```bash
cd backend

# Set database connection
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/teams360?sslmode=disable"

# Install dependencies and run
go mod download
go run cmd/api/main.go
```

The API server will start at http://localhost:8080

### 4. Start the Frontend

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

## Health Dimensions

Teams assess themselves across 11 dimensions:

| Dimension | Good State | Bad State |
|-----------|------------|-----------|
| **Mission** | We know exactly why we are here, and we are really excited about it | We have no idea why we are here |
| **Delivering Value** | We deliver great stuff! Stakeholders are really happy | We deliver crap. Stakeholders hate us |
| **Speed** | We get stuff done quickly. No waiting, no delays | We never seem to get anything done |
| **Fun** | We love going to work and have great fun together | Boooooring |
| **Health of Codebase** | Clean code, easy to read, great test coverage | Technical debt is raging out of control |
| **Learning** | We are learning lots of interesting stuff all the time | We never have time to learn anything |
| **Support** | We always get great support when we ask for it | We keep getting stuck without help |
| **Pawns or Players** | We control our destiny and decide what to build | We are just pawns with no influence |
| **Easy to Release** | Releasing is simple, safe, painless, and automated | Releasing is risky, painful, and takes forever |
| **Suitable Process** | Our way of working fits us perfectly | Our way of working sucks |
| **Teamwork** | We are a tight-knit team that works together well | We are individuals who don't care about each other |

## Architecture

```
teams360/
├── frontend/                 # Next.js 15 application
│   ├── app/                 # App Router pages
│   │   ├── home/           # Team member home page
│   │   ├── survey/         # Health check survey
│   │   ├── dashboard/      # Team lead dashboard
│   │   ├── manager/        # Manager/VP dashboard
│   │   └── admin/          # Admin panel
│   └── lib/                # Utilities, types, data
├── backend/                 # Go API server (Gin framework)
│   ├── cmd/api/            # Application entry point
│   ├── domain/             # Domain layer (DDD)
│   ├── application/        # Application services
│   ├── infrastructure/     # Database, external services
│   └── interfaces/         # API handlers, DTOs
├── tests/                   # E2E acceptance tests
│   └── acceptance/         # Playwright + Ginkgo tests
└── docs/                    # Documentation
```

### Technology Stack

**Frontend:**
- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Recharts (data visualization)
- Lucide React (icons)

**Backend:**
- Go 1.21+
- Gin web framework
- PostgreSQL
- Domain-Driven Design (DDD)

**Testing:**
- Ginkgo v2 (BDD testing)
- Gomega (assertions)
- Playwright (browser automation)

## Development

### Using Make Commands

```bash
# Install all dependencies
make install

# Run both frontend and backend
make dev

# Run tests
make test

# Build for production
make build

# View all available commands
make help
```

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
go test ./...             # Run tests
ginkgo -v ./...           # Run Ginkgo tests
```

### Running E2E Tests

```bash
cd tests
export TEST_DATABASE_URL="postgres://postgres:postgres@localhost:5432/teams360_test?sslmode=disable"
ginkgo -v acceptance/
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login

### Health Checks
- `POST /api/v1/health-checks` - Submit health check
- `GET /api/v1/health-checks/:id` - Get health check by ID
- `GET /api/v1/health-dimensions` - List all dimensions

### Teams
- `GET /api/v1/teams` - List teams
- `GET /api/v1/teams/:teamId/info` - Get team info
- `GET /api/v1/teams/:teamId/dashboard/health-summary` - Team health summary
- `GET /api/v1/teams/:teamId/dashboard/trends` - Team health trends

### Managers
- `GET /api/v1/managers/:managerId/teams/health` - Get supervised teams' health
- `GET /api/v1/managers/:managerId/dashboard/trends` - Aggregated trends

### Users
- `GET /api/v1/users/:userId/survey-history` - User's survey history

### Admin
- `GET /api/v1/admin/users` - List users
- `GET /api/v1/admin/teams` - List teams
- `GET /api/v1/admin/hierarchy-levels` - List hierarchy levels

## Configuration

### Environment Variables

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**Backend**:
```env
PORT=8080
DATABASE_URL=postgres://postgres:postgres@localhost:5432/teams360?sslmode=disable
GIN_MODE=debug  # or "release" for production
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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Spotify Engineering](https://engineering.atspotify.com/2014/09/squad-health-check-model/) for the original Squad Health Check Model
- The open-source community for the amazing tools and frameworks used in this project

## Learn More

- [CLAUDE.md](./CLAUDE.md) - Comprehensive development guide for AI-assisted development
- [Spotify Squad Health Check Model](https://engineering.atspotify.com/2014/09/squad-health-check-model/) - Original inspiration
- [Next.js Documentation](https://nextjs.org/docs)
- [Gin Framework](https://gin-gonic.com/docs/)
- [Ginkgo Testing](https://onsi.github.io/ginkgo/)
