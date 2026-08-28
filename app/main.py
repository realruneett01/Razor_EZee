from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Multimodal Dispute-Evidence Assistant & Preemptive Velocity Shield for Razorpay Merchants",
)

# Enable CORS for Next.js frontend dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from app.webhooks.razorpay import router as webhook_router
from app.api.routes import router as api_router

# Include routers
app.include_router(webhook_router, prefix="/webhooks", tags=["Webhooks"])
app.include_router(api_router, prefix="/api", tags=["API"])


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "version": settings.app_version,
    }
