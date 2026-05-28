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

install:
	cd frontend && npm install

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

api-stop:
	docker stop novabank-backend

api-test:
	cd backend && uv run pytest tests/ -v

api-format:
	cd backend && uv run isort . && uv run black .
