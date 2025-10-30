# Backend Makefile for Team360 Go API
# Follows DDD architecture and TDD practices with Ginkgo/Gomega

.PHONY: help install run build test test-verbose test-coverage clean lint fmt vet tidy

# Default target
.DEFAULT_GOAL := help

# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod
GOFMT=$(GOCMD) fmt
GOVET=$(GOCMD) vet
BINARY_NAME=team360-api
BINARY_PATH=bin/$(BINARY_NAME)
MAIN_PATH=./cmd/api

# Ginkgo parameters
GINKGO=ginkgo
GINKGO_FLAGS=-v --race --randomize-all --randomize-suites --fail-on-pending --trace

help: ## Display this help message
	@echo "Team360 Backend - Go API with Gin, DDD, and TDD"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies and tools
	@echo "Installing Go dependencies..."
	$(GOGET) -u ./...
	$(GOMOD) download
	@echo "Installing Ginkgo CLI..."
	$(GOCMD) install github.com/onsi/ginkgo/v2/ginkgo@latest
	@echo "Installing development tools..."
	$(GOCMD) install github.com/cosmtrek/air@latest
	@echo "Dependencies installed successfully!"

tidy: ## Tidy go.mod and go.sum
	@echo "Tidying Go modules..."
	$(GOMOD) tidy

run: ## Run the API server (development mode)
	@echo "Starting Team360 API server..."
	$(GOCMD) run $(MAIN_PATH)/main.go

dev: ## Run the API server with hot reload (requires air)
	@echo "Starting Team360 API server with hot reload..."
	air

build: ## Build the API binary
	@echo "Building Team360 API..."
	@mkdir -p bin
	$(GOBUILD) -o $(BINARY_PATH) $(MAIN_PATH)/main.go
	@echo "Build complete: $(BINARY_PATH)"

test: ## Run all tests with Ginkgo
	@echo "Running tests with Ginkgo..."
	$(GINKGO) -r ./...

test-verbose: ## Run tests with verbose output
	@echo "Running tests with verbose output..."
	$(GINKGO) $(GINKGO_FLAGS) -r ./...

test-coverage: ## Run tests with coverage report
	@echo "Running tests with coverage..."
	$(GINKGO) -r --cover --coverprofile=coverage.out ./...
	@echo "Generating coverage report..."
	$(GOCMD) tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

test-acceptance: ## Run acceptance tests only
	@echo "Running acceptance tests..."
	$(GINKGO) $(GINKGO_FLAGS) ./tests/acceptance/...

test-watch: ## Run tests in watch mode
	@echo "Running tests in watch mode..."
	$(GINKGO) watch -r ./...

fmt: ## Format Go code
	@echo "Formatting Go code..."
	$(GOFMT) ./...

vet: ## Run go vet
	@echo "Running go vet..."
	$(GOVET) ./...

lint: fmt vet ## Run linters (fmt + vet)
	@echo "Linting complete!"

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	$(GOCLEAN)
	rm -rf bin/
	rm -rf coverage.out coverage.html
	@echo "Clean complete!"

docker-build: ## Build Docker image
	@echo "Building Docker image..."
	docker build -t team360-api:latest .

docker-run: ## Run Docker container
	@echo "Running Docker container..."
	docker run -p 8080:8080 team360-api:latest

.PHONY: all
all: clean install lint test build ## Run all tasks (clean, install, lint, test, build)
