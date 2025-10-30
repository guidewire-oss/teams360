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
