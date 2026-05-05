from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.config import settings
from app.database import SessionLocal, get_db
from app.models import User
from app.schemas import (
    AnalyzeResponse,
    AuthResponse,
    LoginRequest,
    UserCreate,
    UserPublic,
    UserUpdate,
)
from app.services.auth import (
    authenticate_user,
    create_access_token,
    ensure_default_admin,
    get_current_user,
    get_user_by_email,
    hash_password,
    init_auth_storage,
    normalize_email,
    require_admin,
)
from app.services.image_analyzer import analyze_image
from app.services.ollama_client import analyze_with_ollama
from app.utils.file_utils import (
    build_marked_filename,
    ensure_storage_directories,
    safe_result_path,
    save_upload_file,
)


app = FastAPI(
    title="Blood Cell Morphology Marker API",
    description="Educational red blood cell morphology screening API.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event() -> None:
    ensure_storage_directories()
    init_auth_storage()
    db = SessionLocal()
    try:
        ensure_default_admin(db)
    finally:
        db.close()


@app.get("/health")
async def health() -> dict[str, object]:
    return {
        "status": "ok",
        "service": "blood-cell-marker-backend",
        "ollama_model": settings.ollama_model,
        "use_gpu": settings.use_gpu,
        "database": "postgresql"
        if settings.database_url.startswith("postgresql")
        else "sqlite",
    }


def serialize_user(user: User) -> UserPublic:
    return UserPublic(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_admin=user.is_admin,
        is_active=user.is_active,
        created_at=user.created_at.isoformat(),
        updated_at=user.updated_at.isoformat(),
    )


@app.post("/auth/login", response_model=AuthResponse)
async def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Email atau password tidak sesuai.")

    return AuthResponse(
        access_token=create_access_token(user),
        user=serialize_user(user),
    )


@app.get("/auth/me", response_model=UserPublic)
async def me(current_user: User = Depends(get_current_user)) -> UserPublic:
    return serialize_user(current_user)


@app.get("/users", response_model=list[UserPublic])
async def list_users(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[UserPublic]:
    users = db.query(User).order_by(User.created_at.desc(), User.id.desc()).all()
    return [serialize_user(user) for user in users]


@app.post("/users", response_model=UserPublic)
async def create_user(
    payload: UserCreate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> UserPublic:
    email = normalize_email(payload.email)
    if get_user_by_email(db, email):
        raise HTTPException(status_code=409, detail="Email sudah terdaftar.")

    full_name = payload.full_name.strip()
    if not full_name:
        raise HTTPException(status_code=400, detail="Nama lengkap wajib diisi.")

    user = User(
        email=email,
        full_name=full_name,
        hashed_password=hash_password(payload.password),
        is_admin=payload.is_admin,
        is_active=payload.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return serialize_user(user)


@app.patch("/users/{user_id}", response_model=UserPublic)
async def update_user(
    user_id: int,
    payload: UserUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> UserPublic:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")

    if user.id == current_admin.id:
        if payload.is_active is False:
            raise HTTPException(
                status_code=400,
                detail="Admin tidak bisa menonaktifkan akun sendiri.",
            )
        if payload.is_admin is False:
            raise HTTPException(
                status_code=400,
                detail="Admin tidak bisa mencabut role admin sendiri.",
            )

    if payload.full_name is not None:
        full_name = payload.full_name.strip()
        if not full_name:
            raise HTTPException(status_code=400, detail="Nama lengkap wajib diisi.")
        user.full_name = full_name

    if payload.password is not None:
        user.hashed_password = hash_password(payload.password)
    if payload.is_admin is not None:
        user.is_admin = payload.is_admin
    if payload.is_active is not None:
        user.is_active = payload.is_active

    db.commit()
    db.refresh(user)
    return serialize_user(user)


@app.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan.")
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=400,
            detail="Admin tidak bisa menghapus akun sendiri.",
        )

    db.delete(user)
    db.commit()
    return {"status": "deleted"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    file: UploadFile = File(...),
    _: User = Depends(get_current_user),
) -> AnalyzeResponse:
    upload_path = await save_upload_file(file)
    result_filename = build_marked_filename(upload_path)
    result_path = safe_result_path(result_filename)

    try:
        image_result = await run_in_threadpool(
            analyze_image,
            upload_path,
            result_path,
            settings.use_gpu,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    ai_analysis = await run_in_threadpool(
        analyze_with_ollama,
        upload_path,
        image_result["summary"],
    )

    return AnalyzeResponse(
        summary=image_result["summary"],
        cells=image_result["cells"],
        marked_image_url=f"/result/{result_filename}",
        ai_analysis=ai_analysis,
    )


@app.get("/result/{filename}")
async def get_result(filename: str) -> FileResponse:
    result_path = safe_result_path(filename)
    if not result_path.exists() or not result_path.is_file():
        raise HTTPException(status_code=404, detail="Gambar hasil tidak ditemukan.")

    return FileResponse(result_path)
