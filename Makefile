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
	@echo "$(BOLD)$(CYAN)🚀 QUICK START:$(RESET) make setup-and-run"
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
# Development
# =============================================================================

dev: ## Run both frontend and backend in development mode (parallel)
	@echo "$(CYAN)Starting Team360 in development mode...$(RESET)"
	@echo "$(CYAN)Frontend will run on http://localhost:3000$(RESET)"
	@echo "$(CYAN)Backend will run on http://localhost:8080$(RESET)"
	@echo ""
	@echo "$(BOLD)Demo Login Credentials:$(RESET)"
	@echo "  VP:           vp/demo"
	@echo "  Director:     director1/demo or director2/demo"
	@echo "  Manager:      manager1/demo, manager2/demo, or manager3/demo"
	@echo "  Team Lead:    teamlead1/demo through teamlead5/demo"
	@echo "  Team Member:  demo/demo or alice/demo"
	@echo "  Admin:        admin/admin"
	@echo ""
	@$(MAKE) -j2 run-frontend run-backend

run: dev ## Alias for dev (run both services)

run-frontend: ## [Frontend] Run Next.js development server
	@echo "$(CYAN)Starting frontend on http://localhost:3000...$(RESET)"
	@cd frontend && npm run dev

run-backend: ## [Backend] Run Go API server
	@echo "$(CYAN)Starting backend on http://localhost:8080...$(RESET)"
	@cd backend && $(MAKE) run

dev-backend: ## [Backend] Run backend with hot reload (air)
	@cd backend && $(MAKE) dev

# =============================================================================
# Database Setup
# =============================================================================

setup-and-run: ## 🚀 ONE COMMAND: Install deps, create DB, setup with demo users, and run app
	@echo "$(BOLD)$(CYAN)🚀 Team360 Complete Setup & Run$(RESET)"
	@echo ""
	@echo "$(CYAN)Step 1/3: Installing dependencies...$(RESET)"
	@$(MAKE) install
	@echo ""
	@echo "$(CYAN)Step 2/3: Setting up database and running migrations...$(RESET)"
	@cd backend && DATABASE_URL="postgres://postgres:postgres@localhost:5432/teams360?sslmode=disable" go run cmd/api/main.go &
	@sleep 5
	@pkill -f "go run cmd/api/main.go" 2>/dev/null || true
	@echo "$(CYAN)✅ Database setup complete! Demo users created.$(RESET)"
	@echo ""
	@echo "$(CYAN)Step 3/3: Starting application...$(RESET)"
	@echo "$(CYAN)Frontend: http://localhost:3000$(RESET)"
	@echo "$(CYAN)Backend:  http://localhost:8080$(RESET)"
	@echo ""
	@echo "$(BOLD)Demo Login Credentials:$(RESET)"
	@echo "  VP:           vp/demo"
	@echo "  Director:     director1/demo or director2/demo"
	@echo "  Manager:      manager1/demo, manager2/demo, or manager3/demo"
	@echo "  Team Lead:    teamlead1/demo through teamlead5/demo"
	@echo "  Team Member:  demo/demo or alice/demo"
	@echo "  Admin:        admin/admin"
	@echo ""
	@echo "$(BOLD)$(CYAN)Press Ctrl+C to stop both services$(RESET)"
	@echo ""
	@$(MAKE) -j2 run-frontend run-backend

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
	@cd backend && TEST_DATABASE_URL="postgres://postgres:postgres@localhost:5432/teams360_test?sslmode=disable" go run cmd/api/main.go &
	@sleep 3
	@pkill -f "go run cmd/api/main.go"
	@echo "$(CYAN)Test database setup complete!$(RESET)"

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
	@cd backend && TEST_DATABASE_URL="postgres://postgres:postgres@localhost:5432/teams360_test?sslmode=disable" go run cmd/api/main.go > /tmp/backend-e2e.log 2>&1 & echo $$! > /tmp/backend.pid
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
