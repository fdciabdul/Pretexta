import time
from collections import defaultdict
from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiter for auth endpoints."""

    def __init__(self, app, max_attempts: int = 10, window_seconds: int = 300):
        super().__init__(app)
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self.attempts: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        if request.url.path == "/api/auth/login" and request.method == "POST":
            client_ip = request.client.host if request.client else "unknown"
            now = time.time()

            # Clean old entries
            self.attempts[client_ip] = [
                t for t in self.attempts[client_ip] if now - t < self.window_seconds
            ]

            if len(self.attempts[client_ip]) >= self.max_attempts:
                raise HTTPException(
                    status_code=429,
                    detail=f"Too many login attempts. Try again in {self.window_seconds // 60} minutes.",
                )

            self.attempts[client_ip].append(now)

        return await call_next(request)
