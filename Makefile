# Root Makefile for Team360 Monorepo
# Orchestrates both Frontend (Next.js/TypeScript) and Backend (Go/Gin)

.PHONY: help install install-frontend install-backend run run-frontend run-backend dev build build-frontend build-backend test test-frontend test-backend clean clean-frontend clean-backend lint lint-frontend lint-backend

# Default target
.DEFAULT_GOAL := help

# Colors for output
CYAN := \033[36m
RESET := \033[0m
BOLD := \033[1m

help: ## Display this help message
	@echo "$(BOLD)Team360 - Squad Health Check Application$(RESET)"
	@echo "Full-stack application with Go backend and Next.js frontend"
	@echo ""
	@echo "$(BOLD)$(CYAN)🚀 QUICK START:$(RESET) make run"
	@echo ""
	@echo "$(CYAN)Usage:$(RESET) make [target]"
	@echo ""
	@echo "$(CYAN)Main Targets:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -v "Frontend\|Backend" | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(CYAN)Frontend Targets:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?##.*Frontend' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(CYAN)Backend Targets:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?##.*Backend' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$2}'

# =============================================================================
# Installation & Setup
# =============================================================================

install: install-frontend install-backend ## Install all dependencies (frontend + backend)

install-frontend: ## [Frontend] Install npm dependencies
	@echo "$(CYAN)Installing frontend dependencies...$(RESET)"
	@cd frontend && npm install
	@echo "$(CYAN)Frontend dependencies installed!$(RESET)"

install-backend: ## [Backend] Install Go dependencies
	@echo "$(CYAN)Installing backend dependencies...$(RESET)"
	@cd backend && $(MAKE) install
	@echo "$(CYAN)Backend dependencies installed!$(RESET)"

# =============================================================================
# Running the Application
# =============================================================================

run: ensure-deps ensure-db kill-servers print-banner ## 🚀 Run the app locally (auto-installs deps, starts both servers)
	@$(MAKE) -j2 start-frontend start-backend

# Kill any existing servers on ports 3000 and 8080
kill-servers:
	@lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@lsof -ti:8080 | xargs kill -9 2>/dev/null || true
	@sleep 1

# Auto-install dependencies if missing
ensure-deps:
	@if [ ! -d "frontend/node_modules" ]; then \
		echo "$(CYAN)Installing frontend dependencies...$(RESET)"; \
		cd frontend && npm install; \
	fi
	@if ! grep -q "golang.org/x/crypto" backend/go.sum 2>/dev/null; then \
		echo "$(CYAN)Installing backend dependencies...$(RESET)"; \
		cd backend && go mod download; \
	fi

# Ensure database exists and has demo data
ensure-db:
	@echo "$(CYAN)Checking database...$(RESET)"
	@if command -v docker >/dev/null 2>&1; then \
		if docker ps | grep -qE "teams360-(db|test)"; then \
			echo "$(CYAN)PostgreSQL container already running.$(RESET)"; \
		elif docker ps -a | grep -qE "teams360-(db|test)"; then \
			CONTAINER=$$(docker ps -a --format '{{.Names}}' | grep -E "teams360-(db|test)" | head -1); \
			echo "$(CYAN)Starting existing PostgreSQL container ($$CONTAINER)...$(RESET)"; \
			docker start $$CONTAINER; \
			sleep 3; \
		elif ! lsof -i:5432 >/dev/null 2>&1; then \
			echo "$(CYAN)Creating PostgreSQL container...$(RESET)"; \
			docker run -d --name teams360-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15; \
			sleep 3; \
		else \
			echo "$(CYAN)Port 5432 already in use (existing PostgreSQL).$(RESET)"; \
		fi; \
	fi
	@echo "$(CYAN)Database ready. Migrations will run on backend startup.$(RESET)"

# =============================================================================
# Database Setup
# =============================================================================

db-setup: ## Setup production database with migrations and seed data
	@echo "$(CYAN)Setting up production database...$(RESET)"
	@cd backend && DATABASE_URL="postgres://postgres:postgres@localhost:5432/teams360?sslmode=disable" go run cmd/api/main.go &
	@sleep 3
	@pkill -f "go run cmd/api/main.go"
	@echo "$(CYAN)Database setup complete! Demo users created.$(RESET)"

db-reset: ## Reset production database (WARNING: deletes all data)
	@echo "$(CYAN)Resetting production database...$(RESET)"
	@psql -U postgres -d teams360 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	@$(MAKE) db-setup

db-test-setup: ## Setup test database with migrations and seed data
	@echo "$(CYAN)Setting up test database...$(RESET)"
	@cd backend && DATABASE_URL="postgres://postgres:postgres@localhost:5432/teams360_test?sslmode=disable" go run cmd/api/main.go &
	@sleep 3
	@pkill -f "go run cmd/api/main.go"
	@echo "$(CYAN)Test database setup complete!$(RESET)"

print-banner:
	@echo ""
	@echo "$(BOLD)$(CYAN)🚀 Starting Team360...$(RESET)"
	@echo ""
	@echo "$(CYAN)Frontend: http://localhost:3000$(RESET)"
	@echo "$(CYAN)Backend:  http://localhost:8080$(RESET)"
	@echo ""
	@echo "$(BOLD)Demo Credentials:$(RESET)"
	@echo "  demo/demo      - Team Member"
	@echo "  manager1/demo  - Manager"
	@echo "  admin/admin    - Administrator"
	@echo ""
	@echo "$(CYAN)Press Ctrl+C to stop$(RESET)"
	@echo ""

start-frontend:
	@cd frontend && npm run dev

start-backend:
	@cd backend && go run cmd/api/main.go

# =============================================================================
# Development (with hot reload / watch mode)
# =============================================================================

dev: ensure-deps ## Run with hot reload for active development (requires 'air' for backend)
	@echo "$(BOLD)$(CYAN)🔧 Starting Team360 in development mode (hot reload)...$(RESET)"
	@echo ""
	@echo "$(CYAN)Frontend: http://localhost:3000 (Next.js hot reload)$(RESET)"
	@echo "$(CYAN)Backend:  http://localhost:8080 (air hot reload)$(RESET)"
	@echo ""
	@echo "$(BOLD)Tip:$(RESET) Install 'air' for backend hot reload: go install github.com/air-verse/air@latest"
	@echo ""
	@$(MAKE) -j2 start-frontend dev-backend

dev-backend: ## [Backend] Run backend with hot reload (air)
	@cd backend && (command -v air >/dev/null 2>&1 && air || (echo "$(CYAN)air not installed, using go run...$(RESET)" && go run cmd/api/main.go))

# =============================================================================
# Build
# =============================================================================

build: build-frontend build-backend ## Build both frontend and backend for production

build-frontend: ## [Frontend] Build Next.js for production
	@echo "$(CYAN)Building frontend...$(RESET)"
	@cd frontend && npm run build
	@echo "$(CYAN)Frontend build complete!$(RESET)"

build-backend: ## [Backend] Build Go API binary
	@echo "$(CYAN)Building backend...$(RESET)"
	@cd backend && $(MAKE) build
	@echo "$(CYAN)Backend build complete!$(RESET)"

# =============================================================================
# Testing
# =============================================================================

test: test-backend ## Run all tests (backend with Ginkgo)
	@echo "$(CYAN)All tests passed!$(RESET)"

test-backend: ## [Backend] Run backend tests with Ginkgo
	@echo "$(CYAN)Running backend tests...$(RESET)"
	@cd backend && $(MAKE) test

test-backend-verbose: ## [Backend] Run backend tests with verbose output
	@cd backend && $(MAKE) test-verbose

test-backend-coverage: ## [Backend] Run backend tests with coverage report
	@cd backend && $(MAKE) test-coverage

test-backend-watch: ## [Backend] Run backend tests in watch mode
	@cd backend && $(MAKE) test-watch

test-acceptance: ## [Backend] Run acceptance tests only
	@cd backend && $(MAKE) test-acceptance

test-e2e: ## 🚀 Run E2E tests with both frontend and backend servers
	@echo "$(BOLD)$(CYAN)🧪 Running E2E Tests with Full Stack$(RESET)"
	@echo ""
	@echo "$(CYAN)Killing any existing servers...$(RESET)"
	@pkill -f "go run cmd/api/main.go" 2>/dev/null || true
	@pkill -f "npm run dev|next dev" 2>/dev/null || true
	@sleep 2
	@echo ""
	@echo "$(CYAN)Starting backend server (port 8080)...$(RESET)"
	@cd backend && DATABASE_URL="postgres://postgres:postgres@localhost:5432/teams360_test?sslmode=disable" go run cmd/api/main.go > /tmp/backend-e2e.log 2>&1 & echo $$! > /tmp/backend.pid
	@sleep 3
	@echo ""
	@echo "$(CYAN)Starting frontend server (port 3000)...$(RESET)"
	@cd frontend && npm run dev > /tmp/frontend-e2e.log 2>&1 & echo $$! > /tmp/frontend.pid
	@sleep 5
	@echo ""
	@echo "$(CYAN)Waiting for servers to be healthy...$(RESET)"
	@for i in 1 2 3 4 5 6 7 8 9 10; do \
		if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health | grep -q "200"; then \
			echo "$(CYAN)✅ Backend is healthy!$(RESET)"; \
			break; \
		fi; \
		if [ $$i -eq 10 ]; then \
			echo "$(CYAN)❌ Backend failed to start$(RESET)"; \
			cat /tmp/backend-e2e.log; \
			kill $$(cat /tmp/backend.pid) $$(cat /tmp/frontend.pid) 2>/dev/null || true; \
			rm /tmp/backend.pid /tmp/frontend.pid; \
			exit 1; \
		fi; \
		sleep 1; \
	done
	@for i in 1 2 3 4 5 6 7 8 9 10; do \
		if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then \
			echo "$(CYAN)✅ Frontend is healthy!$(RESET)"; \
			break; \
		fi; \
		if [ $$i -eq 10 ]; then \
			echo "$(CYAN)❌ Frontend failed to start$(RESET)"; \
			cat /tmp/frontend-e2e.log; \
			kill $$(cat /tmp/backend.pid) $$(cat /tmp/frontend.pid) 2>/dev/null || true; \
			rm /tmp/backend.pid /tmp/frontend.pid; \
			exit 1; \
		fi; \
		sleep 1; \
	done
	@echo ""
	@echo "$(CYAN)Running E2E tests...$(RESET)"
	@export TEST_DATABASE_URL="postgres://postgres:postgres@localhost:5432/teams360_test?sslmode=disable" && ginkgo -v tests/acceptance/ 2>&1 | tee /tmp/e2e_test_results.log || (kill $$(cat /tmp/backend.pid) $$(cat /tmp/frontend.pid) 2>/dev/null || true; rm /tmp/backend.pid /tmp/frontend.pid; exit 1)
	@echo ""
	@echo "$(CYAN)Cleaning up servers...$(RESET)"
	@kill $$(cat /tmp/backend.pid) $$(cat /tmp/frontend.pid) 2>/dev/null || true
	@rm /tmp/backend.pid /tmp/frontend.pid
	@echo "$(BOLD)$(CYAN)✅ E2E tests complete!$(RESET)"

# Note: Frontend tests to be added when test framework is configured
test-frontend: ## [Frontend] Run frontend tests (TODO: setup test framework)
	@echo "$(CYAN)Frontend tests not yet configured$(RESET)"
	@echo "TODO: Install Jest or Vitest and configure tests"

# =============================================================================
# Linting & Formatting
# =============================================================================

lint: lint-backend ## Run linters (backend only for now)

lint-backend: ## [Backend] Run Go linters (fmt + vet)
	@echo "$(CYAN)Linting backend...$(RESET)"
	@cd backend && $(MAKE) lint

lint-frontend: ## [Frontend] Run frontend linters (TODO: setup ESLint)
	@echo "$(CYAN)Frontend linting not yet configured$(RESET)"
	@echo "TODO: Install and configure ESLint"

fmt-backend: ## [Backend] Format Go code
	@cd backend && $(MAKE) fmt

# =============================================================================
# Cleanup
# =============================================================================

clean: clean-frontend clean-backend ## Clean all build artifacts

clean-frontend: ## [Frontend] Clean Next.js build artifacts
	@echo "$(CYAN)Cleaning frontend...$(RESET)"
	@cd frontend && rm -rf .next out node_modules/.cache
	@echo "$(CYAN)Frontend cleaned!$(RESET)"

clean-backend: ## [Backend] Clean Go build artifacts
	@echo "$(CYAN)Cleaning backend...$(RESET)"
	@cd backend && $(MAKE) clean
	@echo "$(CYAN)Backend cleaned!$(RESET)"

clean-all: clean ## Alias for clean (remove all artifacts)
	@echo "$(CYAN)Removing node_modules and Go cache...$(RESET)"
	@cd frontend && rm -rf node_modules
	@cd backend && go clean -cache -modcache -testcache

# =============================================================================
# Docker
# =============================================================================

docker-build: ## Build Docker images for both services
	@echo "$(CYAN)Building Docker images...$(RESET)"
	@cd backend && $(MAKE) docker-build
	@echo "TODO: Add frontend Docker build"

docker-run: ## Run services in Docker containers
	@echo "$(CYAN)Running in Docker...$(RESET)"
	@cd backend && $(MAKE) docker-run

# =============================================================================
# Utility
# =============================================================================

status: ## Show project status and structure
	@echo "$(BOLD)$(CYAN)Team360 Project Status$(RESET)"
	@echo ""
	@echo "$(CYAN)Frontend (Next.js 15 + TypeScript):$(RESET)"
	@echo "  Location: ./frontend"
	@echo "  Status:   ✅ Fully functional (demo with localStorage)"
	@echo ""
	@echo "$(CYAN)Backend (Go 1.25 + Gin + DDD):$(RESET)"
	@echo "  Location: ./backend"
	@echo "  Status:   🚧 In Development"
	@echo "  Tests:    Ginkgo/Gomega (TDD approach)"
	@echo ""
	@echo "$(CYAN)Architecture:$(RESET)"
	@echo "  - Domain-Driven Design (DDD)"
	@echo "  - Test-Driven Development (TDD)"
	@echo "  - Outer-loop testing with Ginkgo"
	@echo ""
	@echo "Run '$(CYAN)make help$(RESET)' for available commands"

info: status ## Alias for status

.PHONY: all
all: clean install lint test build ## Full CI pipeline (clean, install, lint, test, build)
	@echo "$(BOLD)$(CYAN)✅ Full build pipeline completed successfully!$(RESET)"
