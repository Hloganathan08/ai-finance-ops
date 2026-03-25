from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import auth, plans, subscriptions, transactions, ai, dashboard

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered multi-tenant billing and finance operations platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(plans.router, prefix="/api/v1")
app.include_router(subscriptions.router, prefix="/api/v1")
app.include_router(transactions.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": f"{settings.APP_NAME} is running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}
