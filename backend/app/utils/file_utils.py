import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.config import RESULTS_DIR, UPLOAD_DIR


ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}


def ensure_storage_directories() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)


def validate_image_upload(file: UploadFile) -> str:
    original_name = file.filename or ""
    suffix = Path(original_name).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Hanya file gambar JPG, JPEG, dan PNG yang didukung.",
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Tipe konten tidak valid. Unggah gambar JPG atau PNG.",
        )

    return suffix


async def save_upload_file(file: UploadFile) -> Path:
    suffix = validate_image_upload(file)
    filename = f"{uuid.uuid4().hex}{suffix}"
    upload_path = UPLOAD_DIR / filename

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="File upload kosong.")

    upload_path.write_bytes(contents)
    return upload_path


def build_marked_filename(upload_path: Path) -> str:
    return f"{upload_path.stem}_marked.png"


def safe_result_path(filename: str) -> Path:
    safe_name = Path(filename).name
    if safe_name != filename:
        raise HTTPException(status_code=400, detail="Nama file hasil tidak valid.")

    suffix = Path(safe_name).suffix.lower()
    if suffix not in {".png", ".jpg", ".jpeg"}:
        raise HTTPException(status_code=400, detail="Tipe file hasil tidak valid.")

    result_path = (RESULTS_DIR / safe_name).resolve()
    results_root = RESULTS_DIR.resolve()
    if results_root not in result_path.parents and result_path != results_root:
        raise HTTPException(status_code=400, detail="Path file hasil tidak valid.")

    return result_path
