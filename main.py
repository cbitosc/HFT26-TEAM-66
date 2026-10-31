"""Project Argon Core v3.0 - Zero-Trust RAM & MCP firewall. Run: uvicorn main:app --reload"""
import asyncio
import hashlib
import hmac
import logging
import math
import os
import re
import secrets
import smtplib
import time
import uuid
from collections import Counter, deque
from datetime import datetime, timezone
from email.message import EmailMessage
from typing import Literal
from urllib.parse import quote

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Logs only ever receive counts, process names and salted fingerprints, never payload text.
log = logging.getLogger("argon")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")

ENGINE = "Project Argon Core v3.0"
app = FastAPI(title="Project Argon Core", version="3.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

SALT = secrets.token_bytes(32)  # lives only in process memory, rotates on restart
FEATHERLESS_URL = "https://api.featherless.ai/v1/chat/completions"
FEATHERLESS_KEY = os.getenv("FEATHERLESS_API_KEY", "")
FEATHERLESS_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct"

MODULES = ["regex-matcher", "entropy-detector", "hmac-fingerprinter", "featherless-auditor", "quarantine-state-machine"]
ACTIVE_QUARANTINES: dict[str, dict] = {}
ALERTS_DB: deque = deque(maxlen=500)
STATS = {"threats": 0, "scans": 0}

# ------------------------------------------------------------------ detection engine
# (type, compiled regex, capture group that holds the secret)
PATTERNS = [
    ("PRIVATE_KEY", re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----.*?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----", re.S), 0),
    ("AWS", re.compile(r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b"), 0),
    ("AWS", re.compile(r"(?i)aws_secret_access_key[\"'\s:=]+([A-Za-z0-9/+=]{40})"), 1),
    ("GITHUB", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{36,}\b"), 0),
    ("GITHUB", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{50,}\b"), 0),
    ("STRIPE", re.compile(r"\b(?:sk|rk)_live_[0-9a-zA-Z]{24,}\b"), 0),
    ("SLACK", re.compile(r"\bxox[abprs]-[A-Za-z0-9-]{10,}\b"), 0),
    ("JWT", re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b"), 0),
    ("DB", re.compile(r"://[^:\s/@]+:([^@\s]+)@"), 1),
]
TOKEN_RE = re.compile(r"[A-Za-z0-9+/=_\-]{16,}")
UUID_RE = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")
HEX_RE = re.compile(r"^[0-9a-fA-F]{32,128}$")
IGNORE = ("node_modules", ".next", "data:image", "sha256-", "sha512-", "REDACTED")


def shannon_entropy(s: str) -> float:
    """H(X) = -sum(p(x) * log2 p(x)) over the characters of s."""
    if not s:
        return 0.0
    n = len(s)
    return -sum((c / n) * math.log2(c / n) for c in Counter(s).values())


def fingerprint(secret: str) -> str:
    return "#sha256:" + hmac.new(SALT, secret.encode(), hashlib.sha256).hexdigest()[:6]


def scrub(text: str) -> tuple[str, list[dict]]:
    detections: list[dict] = []
    seen: set[str] = set()

    def redact(kind: str, secret: str, method: str) -> None:
        nonlocal text
        if not secret or secret in seen:
            return
        seen.add(secret)
        fp = fingerprint(secret)
        tag = f"<REDACTED: {kind}_{fp}>"
        text = text.replace(secret, tag)
        detections.append({"type": kind, "method": method, "fingerprint": fp, "tag": tag, "length": len(secret)})

    for kind, rx, grp in PATTERNS:
        for m in list(rx.finditer(text)):
            redact(kind, m.group(grp), "regex")

    for tok in set(TOKEN_RE.findall(text)):  # stage 2: entropy, with allowlist
        if len(tok) < 16 or UUID_RE.match(tok) or HEX_RE.match(tok) or any(h in tok for h in IGNORE):
            continue
        if shannon_entropy(tok) > 4.5:
            redact("HIGH_ENTROPY", tok, "entropy")
    return text, detections


def risk_of(n: int) -> tuple[int, str]:
    score = 5 if n == 0 else min(100, 30 + 20 * n)
    return score, ("CRITICAL EXFILTRATION RISK" if score >= 70 else "ELEVATED RISK" if n else "CLEAR")


def local_advice(dets: list[dict]) -> str:
    kinds = {d["type"] for d in dets}
    if not kinds:
        return "No secrets found; this payload is safe to send."
    if "PRIVATE_KEY" in kinds:
        return "Revoke and regenerate the exposed private key, then replace it everywhere it was deployed."
    if "AWS" in kinds:
        return "Revoke the exposed AWS key immediately and migrate the workload to short-lived IAM roles."
    if "DB" in kinds:
        return "Rotate the database password now and move credentials into an environment vault."
    return "Rotate the exposed credential and store it in a secrets manager instead of source or prompts."


async def featherless_advice(sanitized: str, dets: list[dict], tool: str) -> str:
    if not FEATHERLESS_KEY or not dets:
        return local_advice(dets)
    body = {
        "model": FEATHERLESS_MODEL,
        "max_tokens": 80,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": "You are a security analyst. Reply with exactly ONE sentence: the single most important remediation action for the administrator. No preamble."},
            {"role": "user", "content": f"AI tool: {tool}\nDetected: {', '.join(sorted({d['type'] for d in dets}))}\nRedacted snippet:\n{sanitized[:1500]}"},
        ],
    }
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.post(FEATHERLESS_URL, headers={"Authorization": f"Bearer {FEATHERLESS_KEY}"}, json=body)
            r.raise_for_status()
            tip = r.json()["choices"][0]["message"]["content"].strip().split("\n")[0]
            return tip or local_advice(dets)
    except Exception as exc:
        log.warning("Featherless unavailable (%s); using local advice", type(exc).__name__)
        return local_advice(dets)


# ------------------------------------------------------------------ models
class ScanRequest(BaseModel):
    payload: str = Field(max_length=200_000)
    source_process: str = Field(default="unknown", max_length=100)
    target_ai_tool: str = Field(default="unknown", max_length=100)


class OtpRequest(BaseModel):
    email_or_phone: str = Field(min_length=5, max_length=120)
    channel: Literal["gmail", "whatsapp"]
    full_name: str = Field(default="", max_length=100)


class VerifyRequest(BaseModel):
    email_or_phone: str = Field(min_length=5, max_length=120)
    code: str = Field(min_length=6, max_length=6)


class PaymentVerify(BaseModel):
    transaction_id: str = Field(max_length=100)


# ------------------------------------------------------------------ core endpoints
@app.get("/health")
async def health():
    return {
        "status": "online",
        "engine": ENGINE,
        "active_modules": MODULES,
        "active_quarantines": len(ACTIVE_QUARANTINES),
        "total_threats": STATS["threats"],
    }


@app.post("/api/v1/scan-payload")
async def scan_payload(req: ScanRequest):
    t0 = time.perf_counter()
    sanitized, dets = scrub(req.payload)
    latency_ms = (time.perf_counter() - t0) * 1000  # scan time only, excludes the AI call
    score, label = risk_of(len(dets))
    STATS["scans"] += 1
    status = "CLEAR"
    if dets:
        STATS["threats"] += 1
        if score >= 50:
            status = "QUARANTINED"
            ACTIVE_QUARANTINES[req.source_process] = {
                "process": req.source_process,
                "target_ai_tool": req.target_ai_tool,
                "since": datetime.now(timezone.utc).isoformat(),
                "risk_score": score,
                "fingerprints": [d["fingerprint"] for d in dets],
            }
        ALERTS_DB.appendleft({
            "id": uuid.uuid4().hex[:12],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_process": req.source_process,
            "target_ai_tool": req.target_ai_tool,
            "types": sorted({d["type"] for d in dets}),
            "fingerprints": [d["fingerprint"] for d in dets],  # fingerprints only, never plaintext
            "risk_score": score,
            "status": status,
        })
        log.info("THREAT process=%s detections=%d score=%d fps=%s", req.source_process, len(dets), score, [d["fingerprint"] for d in dets])
    advice = await featherless_advice(sanitized, dets, req.target_ai_tool)
    return {
        "threat_detected": bool(dets),
        "detections_count": len(dets),
        "sanitized_payload": sanitized,
        "detections": dets,
        "process_status": status,
        "risk_score": score,
        "risk_label": label,
        "featherless_remediation": advice,
        "latency_ms": round(latency_ms, 3),
    }


@app.get("/api/v1/alerts")
async def alerts():
    return {"alerts": list(ALERTS_DB), "active_quarantines": list(ACTIVE_QUARANTINES.values())}


@app.get("/api/v1/models")
async def models():
    return ["Cursor IDE Agent", "Claude Code CLI", "Aider CLI", "Local Ollama", "AutoGPT / LangChain"]


# ------------------------------------------------------------------ OTP auth
OTP_STORE: dict[str, dict] = {}
SESSIONS: dict[str, dict] = {}
OTP_TTL, OTP_MAX_TRIES, OTP_COOLDOWN = 300, 5, 30
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def norm(v: str) -> str:
    return re.sub(r"[\s\-()]", "", v.strip().lower())


def _send_email(to: str, code: str) -> None:
    msg = EmailMessage()
    msg["Subject"] = "Your Project Argon passcode"
    msg["From"] = os.environ["SMTP_USER"]
    msg["To"] = to
    msg.set_content(f"Your 6-digit Argon passcode is {code}. It expires in 5 minutes.")
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10) as s:
        s.login(os.environ["SMTP_USER"], os.environ["SMTP_APP_PASSWORD"])
        s.send_message(msg)


@app.post("/api/v1/auth/send-otp")
async def send_otp(req: OtpRequest):
    key = norm(req.email_or_phone)
    if req.channel == "gmail" and not EMAIL_RE.match(req.email_or_phone.strip()):
        raise HTTPException(400, "Enter a valid email address.")
    if req.channel == "whatsapp" and not re.fullmatch(r"\+?\d{8,15}", key):
        raise HTTPException(400, "Enter a valid phone number with country code.")
    prev = OTP_STORE.get(key)
    if prev and time.time() - prev["sent"] < OTP_COOLDOWN:
        raise HTTPException(429, "Please wait 30 seconds before requesting another passcode.")
    code = f"{secrets.randbelow(900000) + 100000}"
    OTP_STORE[key] = {"code": code, "sent": time.time(), "expires": time.time() + OTP_TTL, "tries": 0}
    delivery = "console"
    if req.channel == "gmail" and os.getenv("SMTP_USER") and os.getenv("SMTP_APP_PASSWORD"):
        try:
            await asyncio.to_thread(_send_email, req.email_or_phone.strip(), code)
            delivery = "email"
        except Exception as exc:
            log.warning("SMTP send failed (%s); passcode printed to console", type(exc).__name__)
    if delivery == "console":
        log.info("[ARGON DEV] passcode for %s via %s: %s", req.email_or_phone, req.channel, code)
    return {"status": "passcode_sent", "channel": req.channel, "delivery": delivery}


@app.post("/api/v1/auth/verify-otp")
async def verify_otp(req: VerifyRequest):
    key = norm(req.email_or_phone)
    rec = OTP_STORE.get(key)
    if not rec or time.time() > rec["expires"]:
        OTP_STORE.pop(key, None)
        raise HTTPException(400, "Passcode expired or not requested.")
    rec["tries"] += 1
    if rec["tries"] > OTP_MAX_TRIES:
        OTP_STORE.pop(key, None)
        raise HTTPException(429, "Too many attempts. Request a new passcode.")
    if not secrets.compare_digest(rec["code"], req.code):
        raise HTTPException(401, "Incorrect passcode.")
    OTP_STORE.pop(key, None)
    token = f"argon_session_{secrets.token_urlsafe(32)}"
    SESSIONS[token] = {"user": key, "created": time.time()}
    return {"authenticated": True, "token": token}


# ------------------------------------------------------------------ payment (simulated)
@app.get("/api/v1/payment/qr-code")
async def payment_qr(tier: str = "pro"):
    if tier != "pro":
        raise HTTPException(400, "Only the 'pro' tier is payable online.")
    upi = "upi://pay?pa=7993139445@ybl&pn=ProjectArgon&am=49&cu=USD"
    return {"qr_url": f"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data={quote(upi, safe='')}", "amount": "$49", "status": "pending"}


@app.post("/api/v1/payment/verify")
async def payment_verify(req: PaymentVerify):
    if len(req.transaction_id.strip()) < 6:
        raise HTTPException(400, "Enter the transaction ID from your payment app.")
    return {"status": "active", "tier": "Pro Developer", "simulated": True}  # DEMO: no bank lookup


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)