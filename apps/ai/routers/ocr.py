"""
UHID AI Service — OCR Router
POST /ai/ocr  → Extract structured data from uploaded medical document image/PDF
"""

import os
import base64
import json
import re
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from PIL import Image
import io

router = APIRouter()


# ─── Response model ───────────────────────────────────────────────────────────

class OCRResult(BaseModel):
    rawText: str
    extractedData: dict
    confidence: str   # "HIGH" | "MEDIUM" | "LOW"
    method: str       # "openai-vision" | "gemini-vision" | "tesseract" | "demo"


# ─── Vision AI extraction ─────────────────────────────────────────────────────

def _extract_with_openai_vision(image_bytes: bytes, mime_type: str, record_type: str) -> tuple[str, dict, str]:
    """Use GPT-4o Vision to extract text and structure from medical document"""
    import openai

    key = os.getenv("OPENAI_API_KEY", "")
    if not key or key.startswith("sk-..."):
        return "", {}, "demo"

    client = openai.OpenAI(api_key=key)
    b64 = base64.b64encode(image_bytes).decode("utf-8")

    prompt = f"""Extract all medical data from this {record_type.replace('_', ' ')} document.
Return a JSON object with:
1. "rawText": the full text content of the document
2. "extractedData": a key-value object of all medical parameters found
   - For lab reports: parameter names as keys, "value unit" strings as values
     e.g. {{"Hemoglobin": "14.2 g/dL", "WBC": "7800 cells/µL", "Platelets": "2.1 lakh/µL"}}
   - For imaging: {{"findings": "...", "impression": "...", "recommendation": "..."}}
   - For prescriptions: {{"medicines": ["Drug 1 dose", "Drug 2 dose"], "diagnosis": "...", "instructions": "..."}}
   - For ECG: {{"rhythm": "...", "rate": "...", "axis": "...", "findings": "..."}}
3. "confidence": "HIGH" if clearly readable, "MEDIUM" if partially readable, "LOW" if very blurry

Return ONLY valid JSON."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}},
                ],
            }],
            max_tokens=1500,
            response_format={"type": "json_object"},
        )
        data = json.loads(response.choices[0].message.content)
        return data.get("rawText", ""), data.get("extractedData", {}), data.get("confidence", "MEDIUM")
    except Exception as e:
        print(f"[OpenAI Vision] Error: {e}")
        return "", {}, "demo"


def _extract_with_gemini_vision(image_bytes: bytes, mime_type: str, record_type: str) -> tuple[str, dict, str]:
    """Use Gemini Vision to extract data"""
    import google.generativeai as genai

    key = os.getenv("GEMINI_API_KEY", "")
    if not key or key.startswith("AIza..."):
        return "", {}, "demo"

    genai.configure(api_key=key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = f"""Extract all medical data from this {record_type.replace('_', ' ')} document.
Return JSON with "rawText" (full text), "extractedData" (key-value medical parameters), and "confidence" (HIGH/MEDIUM/LOW).
Return ONLY valid JSON."""

    try:
        image_part = {"mime_type": mime_type, "data": image_bytes}
        response = model.generate_content(
            [prompt, image_part],
            generation_config=genai.GenerationConfig(
                temperature=0.1,
                response_mime_type="application/json",
            ),
        )
        data = json.loads(response.text)
        return data.get("rawText", ""), data.get("extractedData", {}), data.get("confidence", "MEDIUM")
    except Exception as e:
        print(f"[Gemini Vision] Error: {e}")
        return "", {}, "demo"


def _extract_with_tesseract(image_bytes: bytes) -> tuple[str, dict]:
    """Fallback: basic Tesseract OCR — returns raw text only"""
    try:
        import pytesseract
        img = Image.open(io.BytesIO(image_bytes))
        raw_text = pytesseract.image_to_string(img)
        # Basic key-value extraction from raw text
        extracted = {}
        lines = raw_text.split('\n')
        for line in lines:
            # Match patterns like "Hemoglobin : 14.2 g/dL" or "Hemoglobin    14.2"
            match = re.match(r'^([A-Za-z\s/()]+?)[\s:]+(\d+\.?\d*\s*[a-zA-Z/%µ]+)', line.strip())
            if match:
                key = match.group(1).strip()
                val = match.group(2).strip()
                if 2 < len(key) < 50:
                    extracted[key] = val
        return raw_text, extracted
    except Exception as e:
        print(f"[Tesseract] Error: {e}")
        return "OCR processing failed", {}


# ─── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/", response_model=OCRResult)
async def ocr_document(
    file: UploadFile = File(...),
    recordType: str = Form(default="LAB_REPORT"),
):
    """
    Extract structured data from a medical document (image or PDF).
    Tries: OpenAI Vision → Gemini Vision → Tesseract → Demo
    """
    content = await file.read()
    mime_type = file.content_type or "image/jpeg"

    # For PDFs: convert first page to image
    if mime_type == "application/pdf" or file.filename.lower().endswith(".pdf"):
        try:
            from pdf2image import convert_from_bytes
            images = convert_from_bytes(content, dpi=200, first_page=1, last_page=1)
            if images:
                buf = io.BytesIO()
                images[0].save(buf, format="JPEG", quality=95)
                content = buf.getvalue()
                mime_type = "image/jpeg"
        except Exception as e:
            print(f"[PDF2Image] Error: {e}. Processing as-is.")

    # Try OpenAI Vision
    raw_text, extracted_data, confidence = _extract_with_openai_vision(content, mime_type, recordType)
    if raw_text:
        return OCRResult(rawText=raw_text, extractedData=extracted_data, confidence=confidence, method="openai-vision")

    # Try Gemini Vision
    raw_text, extracted_data, confidence = _extract_with_gemini_vision(content, mime_type, recordType)
    if raw_text:
        return OCRResult(rawText=raw_text, extractedData=extracted_data, confidence=confidence, method="gemini-vision")

    # Try Tesseract
    raw_text, extracted_data = _extract_with_tesseract(content)
    if raw_text and raw_text != "OCR processing failed":
        return OCRResult(rawText=raw_text, extractedData=extracted_data, confidence="LOW", method="tesseract")

    # Demo fallback
    return OCRResult(
        rawText="Document uploaded successfully. OCR processing requires API configuration.",
        extractedData={"status": "OCR pending configuration"},
        confidence="LOW",
        method="demo",
    )
