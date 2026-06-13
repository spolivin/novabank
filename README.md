# NovaBank

![CI (backend)](https://github.com/spolivin/novabank/actions/workflows/ci-backend.yml/badge.svg?branch=master)
![CI (frontend)](https://github.com/spolivin/novabank/actions/workflows/ci-frontend.yml/badge.svg?branch=master)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.136.1-009688?logo=fastapi&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-auth%20%2B%20db-3FCF8E?logo=supabase&logoColor=white)
![Claude](https://img.shields.io/badge/Claude-Sonnet-D97757?logo=anthropic&logoColor=white)

A full-stack banking demo built as a portfolio project. Features a marketing site, authenticated dashboard, and an AI assistant powered by the Claude API.

## Stack

| Layer     | Technology                                                       |
| --------- | ---------------------------------------------------------------- |
| Frontend  | React 19, TypeScript, Vite, Tailwind v4, Motion, React Router v7 |
| Backend   | FastAPI (Python), uv                                             |
| Auth + DB | Supabase                                                         |
| AI        | Claude Sonnet via Anthropic API                                  |
| Deploy    | Vercel (frontend), Railway (backend)                             |

## Features

- Marketing pages: Home, Personal, Cards, Loans, Business, About, Careers, Contact, Security
- Auth: sign up, log in, account deletion
- Dashboard with AI chat assistant (Nova)
- Product catalogue: personal accounts and credit cards with tiered pricing

## Architecture

The frontend and backend are fully separated. The frontend talks to Supabase directly for auth and receives a JWT, which it forwards to the FastAPI backend on every request. The backend verifies the JWT signature via Supabase's JWKS endpoint — no shared secret, no trust on the client's word.

The AI assistant sends the full conversation history on each request (no server-side session state) and is constrained by a system prompt to banking topics only.

## Security decisions worth noting

- **JWT verification via JWKS** — signature is verified against Supabase's public key, not just decoded
- **Rate limiting** — 2 req/min per user on `/ai/chat`; 10 req/min on `/ai/history`; 3 req/hour on `DELETE /users/me`
- **HTTP body limit** — requests over 32 KB are rejected with 413 before reaching any route handler
- **Payload limits** — input capped at 500 characters per message (Pydantic); history limited to 40 messages per request
- **API docs disabled** — `/docs`, `/redoc`, and `/openapi.json` return 404 in all environments
- **Security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Content-Security-Policy: default-src 'none'` applied to every response
- **Service role key stays server-side** — only the anon (publishable) key is exposed in the browser bundle
- **CORS** — allowed origins configured via environment variable, not hardcoded

## Local setup

Prerequisites: Node.js, Python 3.12+, uv, Docker (optional), Supabase CLI.

```bash
# Install frontend dependencies
make install

# Start local Supabase instance
make db-start

# Copy and fill in env files
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# Start frontend dev server
make dev

# Start backend (separate terminal)
make api-start
```

The only value that requires a real secret locally is `ANTHROPIC_API_KEY`. Supabase local dev keys can be retrieved with `make db-status` after starting the instance.

## Other useful commands

```bash
make lint           # ESLint
make test           # Frontend unit tests (vitest)
make db-reset       # Reset local database
make api-test       # Run backend tests
make api-format     # isort + black
make api-build      # Build backend Docker image
make api-docker     # Run containerised backend (uses backend/.env)
make api-logs       # Tail Docker container logs
make api-grep q=error  # Filter container logs by keyword
make api-stop       # Stop the Docker container
```
