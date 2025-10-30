# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Team360 is an open-source (Apache 2.0 licensed) web application based on Spotify's Squad Health Check Model, enhanced with organizational flexibility and hierarchical management capabilities.

**Architecture**: Next.js 15 frontend with Go backend (Gin framework), following Domain-Driven Design (DDD) principles and Test-Driven Development (TDD) practices.

### Purpose & Philosophy

Inspired by [Spotify's Squad Health Check Model](https://engineering.atspotify.com/2014/09/squad-health-check-model), Team360 helps teams systematically assess their working environment and identify improvement areas through structured self-reflection.

**Core Philosophy** (from Spotify):
- Teams are intrinsically motivated and want to succeed
- Health checks are a **support tool**, not a performance evaluation mechanism
- "Red" doesn't mean "bad team" - it means "this team needs support in this area"
- Focus on building team self-awareness and driving targeted improvements
- High-trust environment where honest assessment is encouraged

**Problem It Solves**: Organizational improvement is often a guessing game. Teams lack visibility into what needs fixing and whether changes actually help. Health checks provide structured visualization to reduce uncertainty across multiple perspectives (quality, value, speed, learning, fun, etc.).

### Enhancements Over Original Spotify Model

Team360 extends the original concept with enterprise-ready features:

1. **Hierarchical Organization Support**: Multi-level hierarchy (VP → Director → Manager → Team Lead → Team Member) with supervisor chains
2. **Configurable Dimensions**: 11 health dimensions (expanded from Spotify's ~8), fully customizable
3. **Flexible Cadences**: Weekly, biweekly, monthly, or quarterly check-ins per team
4. **Assessment Periods**: Track trends across defined periods (e.g., "2024 - 1st Half")
5. **Role-Based Access Control**: Granular permissions system for different organizational levels
6. **Aggregated Insights**: Roll-up views for managers and executives across multiple teams
7. **Digital-First**: While Spotify emphasizes face-to-face workshops, Team360 enables distributed teams to participate asynchronously

Built with Next.js 15, TypeScript, and Tailwind CSS for modern, maintainable development.

## Backend Architecture

### Technology Stack

- **Language**: Go 1.25+ (use latest stable as of October 2025)
- **Framework**: Gin (latest version - Go web framework)
- **Architecture**: Domain-Driven Design (DDD)
- **Testing**: Test-Driven Development (TDD) with outer-loop testing
  - **Test Framework**: Ginkgo v2 (latest - BDD-style testing framework)
  - **Assertion Library**: Gomega (latest - matcher/assertion library)
- **Dependencies**: Always use latest stable versions as of October 2025

### Domain-Driven Design Structure

The Go backend follows DDD principles with clear separation of concerns:

```
backend/
├── domain/           # Domain layer (entities, value objects, domain services)
│   ├── user/
│   ├── team/
│   ├── healthcheck/
│   └── organization/
├── application/      # Application layer (use cases, application services)
│   ├── commands/     # Command handlers (write operations)
│   └── queries/      # Query handlers (read operations)
├── infrastructure/   # Infrastructure layer (repositories, external services)
│   ├── persistence/  # Database implementations
│   ├── http/         # HTTP clients, external APIs
│   └── messaging/    # Event bus, message queues
├── interfaces/       # Interface layer (API controllers, DTOs)
│   ├── api/          # Gin HTTP handlers
│   │   └── v1/       # API version 1
│   ├── dto/          # Data Transfer Objects
│   └── middleware/   # Gin middleware
└── tests/            # Integration and acceptance tests
    └── acceptance/   # Ginkgo acceptance tests
```

**Key DDD Concepts**:
- **Aggregates**: User, Team, HealthCheckSession, Organization are aggregate roots
- **Value Objects**: HierarchyLevel, HealthDimension, HealthCheckResponse
- **Domain Events**: UserCreated, TeamAssigned, HealthCheckCompleted, etc.
- **Repositories**: Abstract data access with domain-focused interfaces
- **Domain Services**: Cross-aggregate business logic

### Test-Driven Development with Ginkgo/Gomega

**Outer-Loop TDD Approach**:
1. Write acceptance tests first using Ginkgo (describes user behavior)
2. Implement domain logic to make tests pass
3. Refactor with confidence

**Ginkgo Test Structure**:
```go
var _ = Describe("Health Check Submission", func() {
    Context("when a team member submits a health check", func() {
        It("should save the session and update team metrics", func() {
            // Given
            session := createHealthCheckSession()

            // When
            err := healthCheckService.Submit(session)

            // Then
            Expect(err).NotTo(HaveOccurred())
            Expect(session.Completed).To(BeTrue())
        })
    })
})
```

**Testing Layers**:
- **Unit Tests**: Domain logic, value objects (within domain packages)
- **Integration Tests**: Repository implementations, API handlers
- **Acceptance Tests**: End-to-end user scenarios (Ginkgo/Gomega in `tests/acceptance/`)

### Backend Commands

```bash
# Navigate to backend directory
cd backend

# Install dependencies
go mod download

# Run all tests
go test ./...

# Run Ginkgo tests (with verbose output)
ginkgo -v ./...

# Run tests with coverage
ginkgo -cover ./...

# Run specific test suite
ginkgo -focus="Health Check Submission" ./tests/acceptance

# Start backend server
go run cmd/api/main.go

# Build for production
go build -o bin/team360-api cmd/api/main.go

# Run with hot reload (using air)
air
```

## Development Commands

### Running the Full Stack

**Frontend** (Next.js):
```bash
npm install           # Install dependencies
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm start            # Start production server
```

**Backend** (Go/Gin):
```bash
cd backend
go mod download      # Install dependencies
go run cmd/api/main.go  # Start API server (http://localhost:8080)
ginkgo -v ./...      # Run all tests
```

### Mac ARM64 Issues
If encountering SWC-related errors on Mac ARM64:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json .next
npm install
npm install --force @next/swc-darwin-arm64  # If still having issues
```

## Authentication & Demo Credentials

Authentication is cookie-based using js-cookie. All demo passwords are "demo" except admin ("admin").

Test users by hierarchy level:
- VP: `vp/demo`
- Directors: `director1/demo`, `director2/demo`
- Managers: `manager1/demo`, `manager2/demo`, `manager3/demo`
- Team Leads: `teamlead1/demo` through `teamlead9/demo`
- Team Members: `demo/demo`, `alice/demo`, etc.
- Admin: `admin/admin`

## Architecture & Key Concepts

### Data Architecture

The application uses **localStorage for persistence** in lieu of a database:
- **Health check sessions**: Stored in `localStorage` key `healthCheckSessions`
- **Organization config**: Stored in `localStorage` key `orgConfig`
- **User authentication**: Stored in cookies via js-cookie (expires in 1 day)

This is a demo application - all data is client-side and resets on localStorage clear.

### Core Data Models

Located in `lib/types.ts`:

1. **Hierarchy System**: Configurable organizational levels with granular permissions
   - `HierarchyLevel`: Defines levels (VP, Director, Manager, Team Lead, Team Member)
   - `OrganizationConfig`: Company-wide hierarchy configuration
   - Each level has specific permissions (canViewAllTeams, canEditTeams, etc.)

2. **Teams & Users**:
   - `User`: Has hierarchyLevelId, reportsTo (supervisor), and teamIds (can be in multiple teams)
   - `Team`: Has supervisorChain (full chain of supervisors), members, cadence (survey frequency)

3. **Health Checks**:
   - `HealthDimension`: 11 dimensions based on Spotify's model with Team360 enhancements:
     - **From Spotify's model**: Mission, Delivering Value, Speed, Fun, Health of Codebase, Learning, Support, Pawns or Players
     - **Team360 additions**: Easy to Release, Suitable Process, Teamwork
     - Each dimension has goodDescription/badDescription for clarity (e.g., "We deliver great stuff!" vs "We deliver crap")
     - Dimensions can be enabled/disabled and weighted via isActive and weight properties
   - `HealthCheckSession`: User's responses to health check, includes assessmentPeriod (e.g., "2024 - 1st Half")
   - `HealthCheckResponse`: Score (1=red, 2=yellow, 3=green), trend (improving/stable/declining), optional comment

### Supervisor Chain & Access Control

Teams have a `supervisorChain` array that defines the full reporting hierarchy:
```typescript
supervisorChain: [
  { userId: 'lead1', levelId: 'level-4' },  // Team Lead
  { userId: 'mgr1', levelId: 'level-3' },   // Manager
  { userId: 'dir1', levelId: 'level-2' },   // Director
  { userId: 'vp1', levelId: 'level-1' }     // VP
]
```

Access control logic (in `lib/org-config.ts`):
- `getUserPermissions()`: Returns permissions based on user's hierarchy level
- `canUserAccessTeam()`: Checks if user can view a team (based on permissions, membership, or supervisor chain)
- `getSubordinates()`: Recursively gets all users reporting to a given user

### Key Data Files

- `lib/auth.ts`: Authentication logic and USERS array (45+ demo users)
- `lib/data.ts`: HEALTH_DIMENSIONS (11 dimensions), TEAMS array (9 squads), health check sessions
- `lib/teams-data.ts`: Extended TEAMS_DATA with supervisor chains, mock session generator
- `lib/org-config.ts`: Organization hierarchy configuration and permission system

### Route Structure

- `/` - Landing page (public)
- `/login` - Authentication (public)
- `/survey` - Health check survey (Team Members and up)
- `/dashboard` - Team Lead dashboard (Team Leads only)
- `/manager` - Manager/Director/VP dashboard with team filtering and analytics
- `/admin` - System administration (Admin only)

`middleware.ts` handles route protection and role-based redirects based on user cookie.

### State Management Pattern

The application uses **client-side state with localStorage persistence**:

1. Data is initialized from mock data arrays (USERS, TEAMS, HEALTH_DIMENSIONS)
2. On first load, data may be populated from localStorage if available
3. When data changes (e.g., completing a survey), it's updated in memory and saved to localStorage
4. Pattern in `lib/data.ts`:
   ```typescript
   let healthCheckSessions: HealthCheckSession[] = [];
   const stored = localStorage.getItem('healthCheckSessions');
   // ... load from storage

   export const saveHealthCheckSession = (session: HealthCheckSession) => {
     // ... update in memory
     localStorage.setItem('healthCheckSessions', JSON.stringify(healthCheckSessions));
   };
   ```

### Manager Dashboard Filtering

The manager dashboard (`app/manager/page.tsx`) implements hierarchical team filtering:
- Users see only teams they have access to (based on permissions and supervisor chain)
- Managers see teams where they appear in the supervisorChain
- Directors and VPs see teams of all their subordinates
- Filtering logic uses `canUserAccessTeam()` from `lib/org-config.ts`

### Assessment Periods & Trend Lines

Health check sessions can be tagged with an `assessmentPeriod` (e.g., "2024 - 1st Half"). The Team Lead dashboard uses this to:
- Filter trend data by assessment period
- Show period-specific trend lines on charts
- Allow comparison across different time periods

Implementation in `app/dashboard/page.tsx` uses Recharts LineChart with period-based data filtering.

## Important Implementation Details

### TypeScript Path Aliases
Uses `@/*` for imports (configured in `tsconfig.json`):
```typescript
import { User } from '@/lib/types';
```

### Health Check Score Mapping
- Score 1 (Red) = Poor health
- Score 2 (Yellow) = Medium health
- Score 3 (Green) = Good health

### Data Visualization
Uses Recharts library extensively:
- RadarChart for overall team health
- BarChart for response distributions
- LineChart for trends over time
- Color scheme: Red (#EF4444), Yellow (#F59E0B), Green (#10B981)

### Team Assignments Version
`lib/data.ts` exports `TEAM_ASSIGNMENTS_VERSION` constant - increment this when changing manager-team assignments to trigger re-initialization of cached data.

## Common Development Patterns

When adding features:

1. **New health dimensions**: Update `HEALTH_DIMENSIONS` in `lib/data.ts` (currently 11 dimensions)
2. **New hierarchy levels**: Use functions in `lib/org-config.ts` (`addHierarchyLevel`, `updateHierarchyLevel`)
3. **Access control**: Always check permissions with `getUserPermissions()` and `canUserAccessTeam()`
4. **Data persistence**: Remember to update localStorage when modifying sessions or config
5. **Mock data generation**: See `generateMockHealthSessions()` in `lib/teams-data.ts` for patterns

## Technology Stack

**Frontend**:
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **State**: Client-side with localStorage (will migrate to API calls)
- **Auth**: Cookie-based with js-cookie (will migrate to JWT/session tokens)

**Backend** (In Development):
- **Language**: Go 1.25 (use latest stable as of October 2025)
- **Framework**: Gin (latest version - HTTP router and middleware)
- **Architecture**: Domain-Driven Design (DDD)
- **Testing**: Ginkgo v2 (latest - BDD framework) + Gomega (latest - assertions)
- **Database**: TBD (PostgreSQL recommended for production)
- **ORM**: TBD (GORM or sqlx recommended - use latest versions)
- **Auth**: JWT tokens or session-based (to be implemented)
- **API**: RESTful JSON API (versioned at /api/v1/)

**Important**: Always use the latest stable versions of all Go dependencies as of October 2025. Check `backend/go.mod` for specific pinned versions.

## Open Source Philosophy

Team360 is released under the **Apache 2.0 license** to benefit organizations worldwide. The goal is to make structured team health assessment accessible to any organization, regardless of size or resources.

### Design Principles

When contributing or extending Team360, keep these principles in mind:

1. **Support, Not Surveillance**: Features should help teams improve, never be weaponized for performance reviews
2. **Flexibility First**: Organizations differ - support customization (dimensions, cadences, hierarchies)
3. **Trust-Based Design**: The system assumes honest input; don't build features that incentivize gaming metrics
4. **Privacy Conscious**: Individual responses should inform team aggregates, but protect contributor anonymity where appropriate
5. **Accessibility**: Keep the demo simple - localStorage and mock data allow anyone to try it without backend setup

### Current State & Roadmap

**Current (Demo Phase)**:
- Frontend: Fully functional Next.js app with mock data and localStorage
- Backend: **In Development** - Go 1.25/Gin backend with DDD architecture

**Backend Development Guidelines**:
- Use Go 1.25 as the minimum version
- Apply outer-loop TDD: Write Ginkgo acceptance tests first, then implement
- Follow DDD structure: domain → application → infrastructure → interfaces
- Use latest stable versions of all dependencies (Gin, Ginkgo, Gomega, etc.)
- Maintain clean architecture boundaries

**Migration Path** (Frontend → Backend):
1. **Phase 1**: Set up Go backend structure with DDD layers (domain/application/infrastructure/interfaces)
2. **Phase 2**: Implement domain models (User, Team, HealthCheck aggregates) with Ginkgo tests
3. **Phase 3**: Build API endpoints following TDD with Ginkgo/Gomega
4. **Phase 4**: Add database persistence layer (PostgreSQL + GORM/sqlx)
5. **Phase 5**: Migrate frontend from localStorage to API calls
6. **Phase 6**: Implement proper authentication (JWT or session-based)
7. **Phase 7**: Add export features (CSV/Excel)
8. **Phase 8**: Implement notifications (email/Slack)

**Key Backend Features to Build**:
- RESTful API at `/api/v1/` with Gin
- Repository pattern for data access
- Domain events for cross-aggregate communication
- Comprehensive test coverage with Ginkgo/Gomega
