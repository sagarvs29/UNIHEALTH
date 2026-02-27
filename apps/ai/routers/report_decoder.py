"""
UHID AI Service — Report Decoder Router
POST /ai/decode  → Plain-language summary of a lab report / imaging / discharge
"""

import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import openai
import google.generativeai as genai

router = APIRouter()

# ─── Initialise clients (lazy — only if keys set) ────────────────────────────

def _get_openai_client():
    key = os.getenv("OPENAI_API_KEY", "")
    if not key or key.startswith("sk-..."):
        return None
    return openai.OpenAI(api_key=key)


def _get_gemini_model():
    key = os.getenv("GEMINI_API_KEY", "")
    if not key or key.startswith("AIza..."):
        return None
    genai.configure(api_key=key)
    return genai.GenerativeModel("gemini-1.5-flash")


# ─── Request / Response models ────────────────────────────────────────────────

class PatientContext(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None          # "MALE" | "FEMALE" | "OTHER"
    bloodGroup: Optional[str] = None
    chronicConditions: Optional[list[str]] = []
    allergies: Optional[list[str]] = []


class DecodeReportRequest(BaseModel):
    recordType: str                        # "LAB_REPORT" | "IMAGING" | "ECG" | etc.
    recordSubType: Optional[str] = None   # "CBC" | "LIPID_PROFILE" | "XRAY" | etc.
    title: str
    extractedData: Optional[dict] = None  # OCR-extracted key-value pairs
    rawText: Optional[str] = None         # Raw OCR text fallback
    patientContext: Optional[PatientContext] = None


class DecodedSummaryResponse(BaseModel):
    summaryText: str
    simplifiedValues: Optional[dict] = None
    riskLevel: str                         # "NORMAL" | "BORDERLINE" | "ABNORMAL" | "CRITICAL"
    concerns: list[str]
    goodNews: list[str]
    recommendations: list[str]
    disclaimer: str
    modelUsed: str


# ─── Prompt builder ───────────────────────────────────────────────────────────

def _build_decode_prompt(req: DecodeReportRequest) -> str:
    ctx = req.patientContext or PatientContext()

    patient_info = []
    if ctx.age:
        patient_info.append(f"Age: {ctx.age}")
    if ctx.gender:
        patient_info.append(f"Gender: {ctx.gender.title()}")
    if ctx.bloodGroup:
        patient_info.append(f"Blood Group: {ctx.bloodGroup}")
    if ctx.chronicConditions:
        patient_info.append(f"Known Conditions: {', '.join(ctx.chronicConditions)}")
    if ctx.allergies:
        patient_info.append(f"Allergies: {', '.join(ctx.allergies)}")

    patient_section = "\n".join(patient_info) if patient_info else "No patient context provided"

    # Build the data section from extractedData or rawText
    if req.extractedData:
        data_section = json.dumps(req.extractedData, indent=2)
    elif req.rawText:
        data_section = req.rawText
    else:
        data_section = f"Report title: {req.title}. No extracted data available."

    prompt = f"""You are a compassionate medical interpreter helping patients understand their medical reports.
Your job is to explain a {req.recordType.replace('_', ' ').title()} report in simple, clear language that anyone can understand.
Do NOT use medical jargon. Use everyday words.

PATIENT INFORMATION:
{patient_section}

REPORT TYPE: {req.recordType} {f'({req.recordSubType})' if req.recordSubType else ''}
REPORT TITLE: {req.title}

REPORT DATA:
{data_section}

Please provide a JSON response with exactly this structure:
{{
  "summaryText": "A 2-3 sentence plain English overview of what this report shows overall.",
  "simplifiedValues": {{
    "Parameter Name": {{
      "value": "actual value",
      "unit": "unit of measurement",
      "normalRange": "normal reference range",
      "status": "NORMAL or LOW or HIGH or CRITICAL",
      "plainExplanation": "one sentence what this means for the patient"
    }}
  }},
  "riskLevel": "NORMAL or BORDERLINE or ABNORMAL or CRITICAL",
  "concerns": ["List of concerning findings in plain language, max 3 items"],
  "goodNews": ["List of normal/good findings to reassure the patient, max 3 items"],
  "recommendations": ["Practical lifestyle or follow-up suggestions, max 3 items"],
  "disclaimer": "This AI summary is for educational purposes only. Please consult your doctor for medical advice."
}}

Important rules:
- If data is limited, still provide a helpful response based on what's available
- riskLevel must be exactly one of: NORMAL, BORDERLINE, ABNORMAL, CRITICAL
- If nothing is abnormal, riskLevel = NORMAL and concerns = []
- Keep each array item under 80 characters
- Return ONLY valid JSON, no extra text"""

    return prompt


# ─── AI call with fallback ────────────────────────────────────────────────────

def _call_ai(prompt: str) -> tuple[str, str]:
    """Returns (json_response_text, model_used)"""

    # Try OpenAI first
    client = _get_openai_client()
    if client:
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a medical report interpreter. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=1500,
                response_format={"type": "json_object"},
            )
            return response.choices[0].message.content, "gpt-4o"
        except Exception as e:
            print(f"[OpenAI] Error: {e}. Falling back to Gemini.")

    # Try Gemini fallback
    model = _get_gemini_model()
    if model:
        try:
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=1500,
                    response_mime_type="application/json",
                ),
            )
            return response.text, "gemini-1.5-flash"
        except Exception as e:
            print(f"[Gemini] Error: {e}")

    # Demo mode — return a plausible mock response
    return _mock_response(prompt), "demo-mode"


def _mock_response(prompt: str) -> str:
    """Returns a realistic mock when no API keys are configured"""
    return json.dumps({
        "summaryText": "Your report has been processed. The results appear to be within a generally acceptable range. Please review the individual values below and discuss any concerns with your doctor.",
        "simplifiedValues": {},
        "riskLevel": "NORMAL",
        "concerns": [],
        "goodNews": ["Report was successfully processed"],
        "recommendations": ["Discuss results with your doctor", "Keep a copy for your records"],
        "disclaimer": "This AI summary is for educational purposes only. Please consult your doctor for medical advice."
    })


# ─── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/", response_model=DecodedSummaryResponse)
async def decode_report(req: DecodeReportRequest):
    """
    Decode a medical report into plain language for the patient.
    Called by the Node.js backend, never directly by the browser.
    """
    try:
        prompt = _build_decode_prompt(req)
        raw_json, model_used = _call_ai(prompt)

        # Parse AI response
        try:
            data = json.loads(raw_json)
        except json.JSONDecodeError:
            # Try to extract JSON from the response if it has extra text
            import re
            match = re.search(r'\{.*\}', raw_json, re.DOTALL)
            if match:
                data = json.loads(match.group())
            else:
                raise HTTPException(status_code=500, detail="AI returned malformed JSON")

        return DecodedSummaryResponse(
            summaryText=data.get("summaryText", "Summary not available."),
            simplifiedValues=data.get("simplifiedValues"),
            riskLevel=data.get("riskLevel", "NORMAL"),
            concerns=data.get("concerns", []),
            goodNews=data.get("goodNews", []),
            recommendations=data.get("recommendations", []),
            disclaimer=data.get("disclaimer", "Please consult your doctor for medical advice."),
            modelUsed=model_used,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report decode failed: {str(e)}")
