# Frontend
dev:
	cd frontend && npm run dev

build:
	cd frontend && npm run build

lint:
	cd frontend && npm run lint

format:
	cd frontend && npm run format

format-check:
	cd frontend && npm run format:check

test:
	cd frontend && npm run test

install:
	cd frontend && npm install

audit:
	cd frontend && npm audit

# Supabase 
db-start:
	cd frontend && npx supabase start

db-stop:
	cd frontend && npx supabase stop

db-status:
	cd frontend && npx supabase status

db-reset:
	cd frontend && npx supabase db reset

db-migration:
	cd frontend && npx supabase migration new $(name)

# Backend
api-start:
	cd backend && uv run uvicorn main:app

api-build:
	docker build -t novabank-backend ./backend

api-docker:
	docker run --rm -d --env-file backend/.env --add-host=host.docker.internal:host-gateway -e SUPABASE_URL=http://host.docker.internal:54321 -p 8000:8000 --name novabank-backend novabank-backend

api-logs:
	docker logs -f novabank-backend

api-grep:
	docker logs novabank-backend 2>&1 | grep $(q)

api-stop:
	docker stop novabank-backend

api-test:
	cd backend && uv run pytest tests/ -v

api-format:
	cd backend && uv run isort . && uv run black .
