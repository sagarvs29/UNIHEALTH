from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title="UHID AI Service",
    description="AI microservice for Report Decoding, Pharma-Check, and Clinical Summary",
    version="1.0.0",
)

# CORS — only allow the backend API to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("BACKEND_URL", "http://localhost:5000"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes (will be added in Phase 3) ─────────────────────────────────────────
# from routers import report_decoder, pharma_check, clinical_summary
# app.include_router(report_decoder.router, prefix="/ai/decode",   tags=["Report Decoder"])
# app.include_router(pharma_check.router,   prefix="/ai/pharma",   tags=["Pharma Check"])
# app.include_router(clinical_summary.router, prefix="/ai/summary", tags=["Clinical Summary"])


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "UHID AI Service",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("AI_PORT", "8000")),
        reload=True,
    )
