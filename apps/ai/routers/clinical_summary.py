"""
UHID AI Service — Clinical Summary Router
POST /ai/clinical-summary  → Doctor-facing patient summary with risk score
"""

import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import openai
import google.generativeai as genai

router = APIRouter()


# ─── Request / Response models ────────────────────────────────────────────────

class RecentRecord(BaseModel):
    recordType: str
    recordSubType: Optional[str] = None
    title: str
    testDate: Optional[str] = None
    extractedData: Optional[dict] = None
    aiSummaryRiskLevel: Optional[str] = None


class RecentPrescription(BaseModel):
    visitDate: str
    diagnosis: Optional[str] = None
    medicines: list[str] = []
    hasInteractions: bool = False


class ClinicalSummaryRequest(BaseModel):
    # Patient basic info
    patientUhid: str
    age: Optional[int] = None
    gender: Optional[str] = None
    bloodGroup: Optional[str] = None
    chronicConditions: list[str] = []
    allergies: list[str] = []
    currentMedications: list[str] = []

    # History
    recentRecords: list[RecentRecord] = []
    recentPrescriptions: list[RecentPrescription] = []

    # Context
    requestingDoctorSpecialty: Optional[str] = None


class LabTrend(BaseModel):
    parameter: str
    unit: str
    values: list[dict]   # [{ "date": "2025-01-15", "value": "14.2", "status": "NORMAL" }]


class ClinicalSummaryResponse(BaseModel):
    riskScore: int                     # 0–100
    riskLevel: str                     # "LOW" | "MODERATE" | "HIGH" | "CRITICAL"
    keySummary: str                    # 2–3 sentence overview for the doctor
    activeConditions: list[str]        # Current active conditions
    medicationConcerns: list[str]      # Medication review flags
    recentConcerns: list[str]          # Recent abnormal findings
    recommendations: list[str]         # Clinical recommendations
    labTrends: list[LabTrend]          # Trending parameters
    modelUsed: str


# ─── Prompt builder ───────────────────────────────────────────────────────────

def _build_clinical_prompt(req: ClinicalSummaryRequest) -> str:
    records_text = ""
    for r in req.recentRecords[:5]:  # Last 5 records
        records_text += f"\n- {r.recordType} ({r.recordSubType or 'N/A'}): {r.title}"
        if r.testDate:
            records_text += f" [{r.testDate}]"
        if r.aiSummaryRiskLevel:
            records_text += f" — Risk: {r.aiSummaryRiskLevel}"
        if r.extractedData:
            key_vals = list(r.extractedData.items())[:4]
            records_text += " | " + ", ".join(f"{k}: {v}" for k, v in key_vals)

    prescriptions_text = ""
    for p in req.recentPrescriptions[:3]:
        prescriptions_text += f"\n- {p.visitDate}: {p.diagnosis or 'No diagnosis'}"
        if p.medicines:
            prescriptions_text += f" → Meds: {', '.join(p.medicines[:5])}"
        if p.hasInteractions:
            prescriptions_text += " ⚠️ Has drug interactions"

    prompt = f"""You are a clinical decision support AI assisting a {req.requestingDoctorSpecialty or 'General'} physician.
Provide a concise, clinically useful patient summary. Use medical terminology appropriate for a doctor.

PATIENT OVERVIEW:
- UHID: {req.patientUhid}
- Age: {req.age or 'Unknown'}, Gender: {req.gender or 'Unknown'}, Blood Group: {req.bloodGroup or 'Unknown'}
- Chronic Conditions: {', '.join(req.chronicConditions) if req.chronicConditions else 'None documented'}
- Allergies: {', '.join(req.allergies) if req.allergies else 'None documented'}
- Current Medications: {', '.join(req.currentMedications) if req.currentMedications else 'None documented'}

RECENT MEDICAL RECORDS (last 5):{records_text if records_text else " No records available"}

RECENT PRESCRIPTIONS (last 3):{prescriptions_text if prescriptions_text else " No prescriptions available"}

Provide a clinical summary as JSON with exactly this structure:
{{
  "riskScore": <integer 0-100, where 0=perfectly healthy, 100=critical>,
  "riskLevel": "LOW or MODERATE or HIGH or CRITICAL",
  "keySummary": "2-3 sentence clinical overview. Mention most important active concerns.",
  "activeConditions": ["List of currently active/relevant conditions from history"],
  "medicationConcerns": ["Any polypharmacy, adherence, or interaction concerns"],
  "recentConcerns": ["Abnormal lab findings or clinical flags from recent records"],
  "recommendations": ["Up to 3 clinical recommendations for this visit"],
  "labTrends": [
    {{
      "parameter": "e.g. HbA1c",
      "unit": "e.g. %",
      "values": [
        {{"date": "YYYY-MM-DD", "value": "numeric_string", "status": "NORMAL or HIGH or LOW or CRITICAL"}}
      ]
    }}
  ]
}}

Rules:
- riskScore: base on number of abnormal values, chronic conditions, age, interaction flags
- If no concerning data: riskScore ≤ 20, riskLevel = "LOW"
- labTrends: only include parameters that appear in the records data
- Return ONLY valid JSON"""

    return prompt


# ─── AI call with fallback ────────────────────────────────────────────────────

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


def _call_ai(prompt: str) -> tuple[str, str]:
    client = _get_openai_client()
    if client:
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a clinical decision support AI. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                max_tokens=2000,
                response_format={"type": "json_object"},
            )
            return response.choices[0].message.content, "gpt-4o"
        except Exception as e:
            print(f"[OpenAI] Error: {e}. Falling back to Gemini.")

    model = _get_gemini_model()
    if model:
        try:
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=2000,
                    response_mime_type="application/json",
                ),
            )
            return response.text, "gemini-1.5-flash"
        except Exception as e:
            print(f"[Gemini] Error: {e}")

    return _mock_clinical_response(), "demo-mode"


def _mock_clinical_response() -> str:
    return json.dumps({
        "riskScore": 25,
        "riskLevel": "LOW",
        "keySummary": "Patient presents with no acute concerns based on available records. Chronic conditions appear stable. Recommend routine follow-up.",
        "activeConditions": [],
        "medicationConcerns": [],
        "recentConcerns": [],
        "recommendations": ["Continue current management", "Schedule routine follow-up in 3 months"],
        "labTrends": []
    })


# ─── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/", response_model=ClinicalSummaryResponse)
async def get_clinical_summary(req: ClinicalSummaryRequest):
    """
    Generate AI clinical summary for a doctor viewing a patient's history.
    """
    try:
        prompt = _build_clinical_prompt(req)
        raw_json, model_used = _call_ai(prompt)

        try:
            data = json.loads(raw_json)
        except json.JSONDecodeError:
            import re
            match = re.search(r'\{.*\}', raw_json, re.DOTALL)
            if match:
                data = json.loads(match.group())
            else:
                raise HTTPException(status_code=500, detail="AI returned malformed JSON")

        # Parse labTrends safely
        lab_trends = []
        for lt in data.get("labTrends", []):
            try:
                lab_trends.append(LabTrend(**lt))
            except Exception:
                pass

        return ClinicalSummaryResponse(
            riskScore=max(0, min(100, int(data.get("riskScore", 0)))),
            riskLevel=data.get("riskLevel", "LOW"),
            keySummary=data.get("keySummary", "No summary available."),
            activeConditions=data.get("activeConditions", []),
            medicationConcerns=data.get("medicationConcerns", []),
            recentConcerns=data.get("recentConcerns", []),
            recommendations=data.get("recommendations", []),
            labTrends=lab_trends,
            modelUsed=model_used,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clinical summary failed: {str(e)}")
