from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title="UHID AI Service",
    description="AI microservice for Report Decoding, OCR, and Clinical Summary",
    version="2.0.0",
)

# CORS — only allow the backend API to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("BACKEND_URL", "http://localhost:5000"),
        "http://localhost:5000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
from routers import report_decoder, clinical_summary, ocr

app.include_router(report_decoder.router, prefix="/ai/decode",   tags=["Report Decoder"])
app.include_router(clinical_summary.router, prefix="/ai/clinical-summary", tags=["Clinical Summary"])
app.include_router(ocr.router,             prefix="/ai/ocr",     tags=["OCR"])


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "UHID AI Service",
        "version": "2.0.0",
        "endpoints": [
            "POST /ai/decode              — Plain-language report decoder",
            "POST /ai/clinical-summary    — Doctor-facing clinical summary",
            "POST /ai/ocr                 — OCR text extraction from documents",
        ],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("AI_PORT", "8000")),
        reload=True,
    )
