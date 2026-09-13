# syntax=docker/dockerfile:1

# Use a Python image with uv pre-installed (uv pinned for reproducible builds)
FROM ghcr.io/astral-sh/uv:0.12.13-python3.12-trixie-slim

# Setup a non-root user
RUN groupadd --system --gid 999 nonroot \
 && useradd --system --gid 999 --uid 999 --create-home nonroot

# Install the project into `/app`
WORKDIR /app

# Keeps Python from buffering stdout and stderr to avoid situations where
# the application crashes without emitting any logs due to buffering.
ENV PYTHONUNBUFFERED=1

# App code is owned by root, so the nonroot user can't write __pycache__
# next to it anyway; don't try.
ENV PYTHONDONTWRITEBYTECODE=1

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy from the cache instead of linking since it's a mounted volume
ENV UV_LINK_MODE=copy

# Omit development dependencies
ENV UV_NO_DEV=1

# Ensure installed tools can be executed out of the box
ENV UV_TOOL_BIN_DIR=/usr/local/bin

# Install the project's dependencies using the lockfile and settings
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project

# Then add the application source code. It sits in its own layer so that
# editing the code does not invalidate the dependency layer above.
# The project itself is not a package (`package = false`), so there is
# nothing else to install here.
COPY . /app

# entrypoint.sh is tracked in git without the executable bit
RUN chmod 755 /app/entrypoint.sh

# Place executables in the environment at the front of the path
ENV PATH="/app/.venv/bin:$PATH"

# Use the non-root user to run our application
USER nonroot

EXPOSE 8000

# The slim image has no curl, so probe the liveness endpoint with Python
HEALTHCHECK --interval=60s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen(f'http://127.0.0.1:{os.environ.get(\"PORT\", \"8000\")}/health/api', timeout=4)"

ENTRYPOINT ["./entrypoint.sh"]
