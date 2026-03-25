import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware

from services.database import db
from services.auth import hash_password
from models.schemas import User
from middleware.rate_limit import RateLimitMiddleware
from routes import (
    auth_router,
    challenges_router,
    quizzes_router,
    simulations_router,
    llm_router,
    settings_router,
    imports_router,
    reports_router,
    leaderboard_router,
    analytics_router,
    organizations_router,
    campaigns_router,
    notifications_router,
    webhooks_router,
    scenario_builder_router,
    debrief_router,
    certificates_router,
    adaptive_router,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup: seed default admin user
    existing_user = await db.users.find_one({"username": "soceng"})
    if not existing_user:
        seed_user = User(
            username="soceng",
            password_hash=hash_password("Cialdini@2025!"),
            display_name="Admin",
            role="admin",
        )
        doc = seed_user.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        await db.users.insert_one(doc)
        logger.info("Seed admin user created: soceng")

    # Ensure indexes
    await db.users.create_index("username", unique=True)
    await db.organizations.create_index("invite_code", unique=True, sparse=True)
    await db.notifications.create_index([("user_id", 1), ("read", 1)])
    await db.simulations.create_index([("user_id", 1), ("status", 1)])
    await db.campaign_progress.create_index([("campaign_id", 1), ("user_id", 1)])

    # Warn about default JWT secret
    jwt_secret = os.environ.get("JWT_SECRET", "")
    if not jwt_secret or jwt_secret == "change-this-secret-key-in-production":
        logger.warning("WARNING: Using default JWT secret. Set JWT_SECRET env var in production!")

    yield

    # Shutdown
    from services.database import client
    client.close()


# Create the app
app = FastAPI(
    title="Pretexta API",
    description="Social Engineering Simulation Lab API",
    version="2.0.0",
    lifespan=lifespan,
)

# API router with /api prefix
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Pretexta API", "version": "2.0.0"}


@api_router.get("/health")
async def health_check():
    """Health check endpoint for Docker and monitoring."""
    try:
        await db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception:
        return {"status": "degraded", "database": "disconnected"}


# Register all route modules
api_router.include_router(auth_router)
api_router.include_router(challenges_router)
api_router.include_router(quizzes_router)
api_router.include_router(simulations_router)
api_router.include_router(llm_router)
api_router.include_router(settings_router)
api_router.include_router(imports_router)
api_router.include_router(reports_router)
api_router.include_router(leaderboard_router)
api_router.include_router(analytics_router)
api_router.include_router(organizations_router)
api_router.include_router(campaigns_router)
api_router.include_router(notifications_router)
api_router.include_router(webhooks_router)
api_router.include_router(scenario_builder_router)
api_router.include_router(debrief_router)
api_router.include_router(certificates_router)
api_router.include_router(adaptive_router)

app.include_router(api_router)

# Middleware (order matters: last added = first executed)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RateLimitMiddleware, max_attempts=10, window_seconds=300)
