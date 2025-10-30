# Team360 Health Check

An open-source (Apache 2.0) full-stack application implementing the Spotify Squad Health Check Model for tracking and improving team health metrics across organizational hierarchies.

**Architecture**: Next.js 15 frontend + Go 1.25 backend (Gin framework) following Domain-Driven Design (DDD) and Test-Driven Development (TDD) principles.

## 🚀 Quick Start

### Run Both Services

```bash
# Install all dependencies
make install

# Run frontend and backend together
make dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8080](http://localhost:8080)

### Run Services Separately

```bash
# Frontend only (Next.js)
make run-frontend

# Backend only (Go API)
make run-backend
```

### View All Available Commands

```bash
make help
```

### 🛠 Mac ARM64 Troubleshooting

If you encounter SWC-related errors on Mac ARM64:

```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json .next
npm install

# If still having issues, force reinstall SWC
npm install --force @next/swc-darwin-arm64
```

If module resolution fails:
```bash
# Ensure you're in project root and restart dev server
npm run dev
```

## 🔑 Login Credentials

### Hierarchy Levels (all passwords are "demo" except admin):
- **Vice President**: `vp/demo`
- **Directors**: `director1/demo`, `director2/demo`  
- **Managers**: `manager1/demo`, `manager2/demo`, `manager3/demo`
- **Team Leads**: `teamlead1/demo`, `teamlead2/demo`, `teamlead3/demo`, `teamlead4/demo`
- **Team Member**: `demo/demo`
- **Administrator**: `admin/admin`

## 📋 Features

### For Team Members
- Complete quarterly health check surveys
- Rate 8 dimensions on a red/yellow/green scale
- Track trends (improving/stable/declining)
- Add optional comments for context

### For Managers
- View team health summaries with visual dashboards
- Monitor health trends over time
- Compare metrics across multiple teams
- Analyze response distributions

### For Administrators
- Manage teams and users
- Configure health check cadences (weekly/monthly/quarterly)
- Customize health dimensions
- Set up notification preferences

## 🎯 Health Dimensions

Based on Spotify's model, teams assess:

1. **Mission** - Clear purpose and excitement
2. **Delivering Value** - Pride in output and stakeholder satisfaction
3. **Speed** - Quick delivery without delays
4. **Fun** - Enjoyment and team cohesion
5. **Health of Codebase** - Clean code and technical debt management
6. **Learning** - Continuous improvement and knowledge growth
7. **Support** - Access to help when needed
8. **Pawns or Players** - Autonomy and control over destiny

## 🛠 Technology Stack

### Frontend (`/frontend`)
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Lucide React** - Modern icon library
- **React Hook Form** - Efficient form handling

### Backend (`/backend`)
- **Go 1.25** - High-performance backend language
- **Gin** - Fast HTTP web framework
- **Ginkgo v2** - BDD testing framework
- **Gomega** - Matcher/assertion library
- **Architecture**: Domain-Driven Design (DDD)
- **Testing**: Test-Driven Development (TDD) with outer-loop testing

## 📁 Monorepo Structure

```
team360/
├── frontend/              # Next.js application
│   ├── app/              # Next.js App Router pages
│   ├── lib/              # Utilities and business logic
│   ├── components/       # React components
│   └── ...
├── backend/              # Go API server
│   ├── cmd/api/         # Application entry point
│   ├── domain/          # Domain layer (DDD)
│   ├── application/     # Application layer (use cases)
│   ├── infrastructure/  # Infrastructure layer
│   ├── interfaces/      # Interface layer (API handlers)
│   └── tests/           # Ginkgo/Gomega tests
├── docs/                # Documentation
├── scripts/             # Build and deployment scripts
├── Makefile             # Root orchestration
└── CLAUDE.md            # AI development guide
```

See individual READMEs for details:
- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)

## 🎨 Key Features

### Survey Experience
- Step-by-step wizard interface
- Visual progress tracking
- Intuitive red/yellow/green selection
- Trend indicators
- Optional comments for context

### Manager Dashboard
- **Overview Tab**: Radar chart and distribution graphs
- **Details Tab**: Dimension-by-dimension breakdown
- **Trends Tab**: Historical data visualization
- Team statistics and next check reminders

### Admin Panel
- Team management with CRUD operations
- User administration
- Cadence configuration
- System settings
- Data retention policies

## 📊 Data Visualization

- **Radar Charts** - Overall team health at a glance
- **Stacked Bar Charts** - Response distribution
- **Line Charts** - Trend analysis over time
- **Color-coded Metrics** - Instant visual feedback

## 🧪 Testing

```bash
# Run all tests
make test

# Run backend tests with Ginkgo
make test-backend

# Run backend tests with coverage
make test-backend-coverage

# Run tests in watch mode
make test-backend-watch
```

## 🏗️ Building

```bash
# Build both frontend and backend
make build

# Build individually
make build-frontend  # Next.js production build
make build-backend   # Go binary in backend/bin/
```

## 🚀 Deployment

### Full Build Pipeline
```bash
make all  # Runs: clean, install, lint, test, build
```

### Environment Variables

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**Backend**:
```env
PORT=8080
GIN_MODE=release
# Database configuration (TBD)
```

## 🔄 Development Roadmap

### Current Status
- ✅ Frontend: Fully functional demo with localStorage
- 🚧 Backend: DDD structure in place, TDD implementation in progress

### Planned Features
- [ ] Backend API implementation (Go/Gin with DDD)
- [ ] Database persistence (PostgreSQL + GORM/sqlx)
- [ ] JWT/session-based authentication
- [ ] Frontend-backend integration
- [ ] Email notifications for upcoming checks
- [ ] CSV/Excel export functionality
- [ ] Real-time updates and collaboration
- [ ] Integration with Slack/Teams
- [ ] Mobile responsive improvements
- [ ] Docker & Kubernetes deployment configs

## 📚 Learn More

- [Spotify Squad Health Check Model](https://engineering.atspotify.com/2014/09/squad-health-check-model/) - Original inspiration
- [CLAUDE.md](./CLAUDE.md) - Comprehensive development guide
- [Frontend README](./frontend/README.md) - Next.js application details
- [Backend README](./backend/README.md) - Go API details
- [Next.js Documentation](https://nextjs.org/docs)
- [Gin Framework](https://gin-gonic.com/docs/)
- [Ginkgo Testing](https://onsi.github.io/ginkgo/)

## 📝 License

Apache 2.0 - Open source for the benefit of all organizations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.