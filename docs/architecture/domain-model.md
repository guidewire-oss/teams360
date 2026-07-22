# Domain Model

The Go backend follows **Domain-Driven Design (DDD)** with clear separation of concerns:

```
backend/
├── cmd/api/            # Application entry point
├── domain/            # Domain layer (entities, value objects, domain services)
│   ├── user/          # User aggregate
│   ├── team/          # Team aggregate
│   ├── healthcheck/   # Health check aggregate
│   └── organization/  # Organization aggregate
├── application/       # Application layer (use cases)
│   ├── commands/      # Command handlers (write operations)
│   └── queries/       # Query handlers (read operations)
├── infrastructure/    # Infrastructure layer
│   ├── persistence/   # Database implementations
│   ├── http/          # HTTP clients, external APIs
│   └── messaging/     # Event bus, message queues
├── interfaces/        # Interface layer
│   ├── api/v1/        # Gin HTTP handlers (API version 1)
│   ├── dto/           # Data Transfer Objects
│   └── middleware/    # Gin middleware
└── tests/             # Integration and acceptance tests
    └── acceptance/    # Ginkgo acceptance tests
```

**Key DDD concepts:**

- **Aggregates**: `User`, `Team`, `HealthCheckSession`, `OrganizationConfig` are aggregate roots
- **Value Objects**: `HierarchyLevel`, `HealthDimension`, `HealthCheckResponse`
- **Repositories**: Abstract data access with domain-focused interfaces
- **Domain Services**: Cross-aggregate business logic
- **Domain Events**: `UserCreated`, `TeamAssigned`, `HealthCheckCompleted`, etc.

## Test-Driven Development

We follow **outer-loop TDD** with Ginkgo:

1. Write acceptance tests first (describes user behavior)
2. Implement domain logic to make tests pass
3. Refactor with confidence

## Core Data Models

Located in `frontend/lib/types.ts`:

1. **Hierarchy System** — configurable organizational levels with granular permissions
   - `HierarchyLevel`: Defines levels (VP, Director, Manager, Team Lead, Team Member)
   - `OrganizationConfig`: Company-wide hierarchy configuration
   - Each level has specific permissions (canViewAllTeams, canEditTeams, etc.)

2. **Teams & Users**
   - `User`: Has hierarchyLevelId, reportsTo (supervisor), and teamIds (can be in multiple teams)
   - `Team`: Has supervisorChain (full chain of supervisors), members, cadence (survey frequency)

3. **Health Checks**
   - `HealthDimension`: 11 dimensions based on Spotify's model with Team Health Check enhancements:
     - **From Spotify's model**: Mission, Delivering Value, Speed, Fun, Health of Codebase, Learning, Support, Pawns or Players
     - **Team Health Check additions**: Easy to Release, Suitable Process, Teamwork
     - Each dimension has goodDescription/badDescription for clarity (e.g., "We deliver great stuff!" vs "We deliver crap")
     - Dimensions can be enabled/disabled and weighted via isActive and weight properties
   - `HealthCheckSession`: User's responses to health check, includes assessmentPeriod (e.g., "2024 - 1st Half")
   - `HealthCheckResponse`: Score (1=red, 2=yellow, 3=green), trend (improving/stable/declining), optional comment

## Assessment Period Logic

Assessment periods are detected automatically (implemented in `frontend/lib/assessment-period.ts`):

- Jan 1 – Jun 30 → "previous year - 2nd Half" (e.g., 2025-01-15 → "2024 - 2nd Half")
- Jul 1 – Dec 31 → "current year - 1st Half" (e.g., 2025-07-15 → "2025 - 1st Half")

This eliminates manual period selection in surveys and enables automatic trend tracking across periods.

```typescript
export function getAssessmentPeriod(date?: Date | string): string {
  const submissionDate = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
  const month = submissionDate.getMonth(); // 0-indexed
  const year = submissionDate.getFullYear();

  if (month >= 0 && month <= 5) {
    return `${year - 1} - 2nd Half`;
  } else {
    return `${year} - 1st Half`;
  }
}
```
