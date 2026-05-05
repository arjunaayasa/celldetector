import base64
import json
from pathlib import Path
from typing import Any

import requests

from app.config import settings


DISCLAIMER = (
    "Aplikasi ini hanya untuk screening visual, edukasi, dan penggunaan pribadi. "
    "Hasil ini bukan diagnosis medis dan harus dikonfirmasi oleh tenaga kesehatan."
)


def fallback_ai_analysis(reason: str) -> dict[str, Any]:
    return {
        "overall_status": "uncertain",
        "confidence": 0,
        "visual_reasoning": reason,
        "recommendation": (
            "Hasil rule-based dari segmentasi tetap tersedia. Periksa konfigurasi Ollama "
            "atau ulangi analisis jika koneksi remote sudah tersedia."
        ),
        "medical_disclaimer": DISCLAIMER,
    }


def encode_image_base64(image_path: Path) -> str:
    return base64.b64encode(image_path.read_bytes()).decode("utf-8")


def build_prompt(summary: dict[str, Any]) -> str:
    return (
        "Kamu adalah asisten analisis visual gambar mikroskop sel darah merah untuk "
        "penggunaan pribadi dan edukasi. Ini bukan diagnosis medis. Analisis gambar "
        "berdasarkan bentuk sel darah merah. Normal jika mayoritas sel relatif bulat, "
        "seragam, tidak terlalu lonjong, tidak bergerigi ekstrem, dan memiliki bentuk "
        "stabil. Abnormal jika banyak sel tampak terlalu lonjong, sabit, tetesan air, "
        "bergerigi, pecah, ukuran sangat tidak seragam, atau tidak simetris. Gunakan "
        "juga ringkasan hasil algoritma: total sel, normal, abnormal, uncertain. "
        "Jawab hanya JSON valid tanpa markdown dengan field: overall_status, "
        "confidence, visual_reasoning, recommendation, medical_disclaimer.\n\n"
        "Ringkasan algoritma:\n"
        f"- total sel: {summary.get('total', 0)}\n"
        f"- normal: {summary.get('normal', 0)} "
        f"({summary.get('normal_percentage', 0)}%)\n"
        f"- abnormal: {summary.get('abnormal', 0)} "
        f"({summary.get('abnormal_percentage', 0)}%)\n"
        f"- uncertain: {summary.get('uncertain', 0)} "
        f"({summary.get('uncertain_percentage', 0)}%)\n"
        "Gunakan confidence sebagai angka 0 sampai 1."
    )


def coerce_confidence(value: Any) -> float:
    try:
        confidence = float(value)
    except (TypeError, ValueError):
        return 0.0

    if confidence > 1:
        confidence = confidence / 100

    return max(0.0, min(1.0, round(confidence, 3)))


def normalize_ai_json(data: dict[str, Any]) -> dict[str, Any]:
    status = str(data.get("overall_status", "uncertain")).lower().strip()
    if status not in {"normal", "abnormal", "uncertain"}:
        status = "uncertain"

    return {
        "overall_status": status,
        "confidence": coerce_confidence(data.get("confidence", 0)),
        "visual_reasoning": str(data.get("visual_reasoning") or "").strip()
        or "AI tidak memberikan reasoning visual yang jelas.",
        "recommendation": str(data.get("recommendation") or "").strip()
        or "Gunakan hasil ini sebagai bahan edukasi, bukan diagnosis medis.",
        "medical_disclaimer": str(data.get("medical_disclaimer") or "").strip()
        or DISCLAIMER,
    }


def analyze_with_ollama(image_path: Path, summary: dict[str, Any]) -> dict[str, Any]:
    base_url = settings.ollama_base_url.rstrip("/")
    url = f"{base_url}/api/generate"
    payload = {
        "model": settings.ollama_model,
        "prompt": build_prompt(summary),
        "images": [encode_image_base64(image_path)],
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.1,
            "num_ctx": 4096,
        },
    }

    try:
        response = requests.post(url, json=payload, timeout=90)
        response.raise_for_status()
    except requests.RequestException as exc:
        return fallback_ai_analysis(
            f"Analisis AI tidak tersedia karena Ollama gagal dihubungi: {exc}"
        )

    try:
        ollama_payload = response.json()
    except ValueError:
        return fallback_ai_analysis(
            f"Ollama mengembalikan response non-JSON: {response.text[:1000]}"
        )

    raw_response = ollama_payload.get("response", "")
    if isinstance(raw_response, dict):
        return normalize_ai_json(raw_response)

    raw_text = str(raw_response).strip()
    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError:
        return {
            "overall_status": "uncertain",
            "confidence": 0,
            "visual_reasoning": raw_text
            or "Ollama tidak mengembalikan response yang bisa diparse.",
            "recommendation": (
                "Gunakan hasil rule-based sebagai referensi utama dan ulangi analisis "
                "AI jika diperlukan."
            ),
            "medical_disclaimer": DISCLAIMER,
        }

    if not isinstance(parsed, dict):
        return fallback_ai_analysis("Ollama tidak mengembalikan objek JSON yang valid.")

    return normalize_ai_json(parsed)
