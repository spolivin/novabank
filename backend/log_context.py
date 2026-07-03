"""Request-scoped log context for the canonical (wide-event) log line.

The middleware installs a fresh dict at the start of each request; handlers
attach fields to it during the request, and the middleware merges those fields
into the single access-log line it emits at the end.

The dict is set once (by reference) in the middleware and mutated in place by
handlers running further down the stack. In-place mutation is what makes this
reliable across the middleware/route task boundary: a child never rebinds the
ContextVar (which the parent middleware wouldn't see), it only updates the
shared object the parent already holds.
"""

from contextvars import ContextVar

# Default is None (not a shared mutable dict); the middleware installs a fresh
# dict per request via reset_log_fields().
_log_fields: ContextVar[dict | None] = ContextVar("log_fields", default=None)


def reset_log_fields() -> None:
    """Install a fresh, empty context for the current request."""
    _log_fields.set({})


def add_log_fields(**fields) -> None:
    """Attach fields to the current request's canonical log line."""
    current = _log_fields.get()
    if current is None:
        current = {}
        _log_fields.set(current)
    current.update(fields)


def get_log_fields() -> dict:
    """Return the fields accumulated for the current request."""
    return _log_fields.get() or {}
