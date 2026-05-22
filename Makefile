DOCKER_USERNAME ?= sai1544
SERVICES = user product order notification analytics
TAG ?= latest

.PHONY: build up down test push clean logs

build:
	@for svc in $(SERVICES); do \
	  echo "Building $$svc-service..."; \
	  docker build -t $(DOCKER_USERNAME)/e-commerce-order-processing-system-$$svc:$(TAG) \
	    services/$$svc-service; \
	done

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

test:
	@echo "Running health checks..."
	@for port in 3001 3002 3003 3004 3005; do \
	  curl -sf http://localhost:$$port/health/live && \
	  echo "Port $$port OK" || echo "Port $$port FAILED"; \
	done

push:
	@for svc in $(SERVICES); do \
	  docker push $(DOCKER_USERNAME)/e-commerce-order-processing-system-$$svc:$(TAG); \
	done

clean:
	docker compose down -v --remove-orphans
	docker system prune -f
