# Blood Cell Morphology Marker

Blood Cell Morphology Marker adalah aplikasi web full-stack untuk penggunaan pribadi dan edukasi. Aplikasi ini menerima unggahan gambar mikroskop sel darah merah, melakukan segmentasi dengan Cellpose, menghitung metrik bentuk dengan OpenCV, lalu membuat gambar hasil marker berupa garis kontur dengan klasifikasi visual: normal, abnormal, atau tidak pasti.

Analisis AI vision memakai Ollama remote dengan model `qwen2.5vl:7b`. Jika Ollama gagal, backend tetap mengembalikan hasil segmentasi, marker, ringkasan, dan tabel metrik.

## Disclaimer Medis

Aplikasi ini bukan alat diagnosis medis dan bukan pengganti pemeriksaan laboratorium profesional. Output hanya untuk penapisan visual, edukasi, dan penggunaan pribadi. Konsultasikan temuan medis dengan dokter atau tenaga kesehatan yang berwenang.

## Fitur

- Masuk berbasis JWT.
- Admin panel untuk tambah user, ubah role admin, aktif/nonaktifkan user, dan hapus user.
- Upload gambar JPG/PNG dan analisis Cellpose + OpenCV.
- Highlight sel dari tabel ke gambar marker.
- Ekspor gambar hasil marker sebagai file PNG.
- Database user memakai PostgreSQL melalui `DATABASE_URL`.

## PostgreSQL Lokal

Di mesin ini Homebrew mendeteksi `postgresql@18` dan service sedang berjalan. Database aplikasi yang dipakai:

```text
database: blood_cell_marker
user: bloodcell
password: bloodcell
```

`backend/.env`:

```env
DATABASE_URL=postgresql+psycopg://bloodcell:bloodcell@localhost:5432/blood_cell_marker
```

Jika PostgreSQL belum tersedia di mesin lain, install dan jalankan:

```bash
brew install postgresql@18
brew services start postgresql@18
```

Lalu buat role dan database:

```bash
psql postgres -c "CREATE ROLE bloodcell LOGIN PASSWORD 'bloodcell';"
createdb -O bloodcell blood_cell_marker
```

## Install Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

Windows PowerShell:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --port 8000
```

Admin awal dibuat otomatis saat backend pertama kali start:

```env
ADMIN_EMAIL=admin@bloodcell.local
ADMIN_PASSWORD=admin12345
```

Ganti `ADMIN_PASSWORD` dan `JWT_SECRET_KEY` untuk penggunaan serius.

## Install Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend berjalan di:

```text
http://localhost:3000
```

## Konfigurasi Ollama Remote

Edit `backend/.env`:

```env
OLLAMA_BASE_URL=http://IP_TAILSCALE_MAC_STUDIO:11434
OLLAMA_MODEL=qwen2.5vl:7b
USE_GPU=false
BACKEND_BASE_URL=http://localhost:8000
```

Test Ollama:

```bash
curl http://IP_TAILSCALE_MAC_STUDIO:11434/api/tags
```

Jika model belum tersedia di Mac Studio:

```bash
ollama pull qwen2.5vl:7b
```

## Cara Pakai

1. Jalankan backend di `http://localhost:8000`.
2. Jalankan frontend di `http://localhost:3000`.
3. Buka `http://localhost:3000`.
4. Masuk dengan akun admin awal atau user yang dibuat admin.
5. Upload gambar JPG atau PNG.
6. Klik `Analisis Gambar`.
7. Klik baris pada tabel `Sel Terdeteksi` untuk menyorot sel di gambar.
8. Klik `Ekspor Gambar` untuk mengunduh hasil marker.

## Endpoint Backend

```text
GET    /health
POST   /auth/login
GET    /auth/me
GET    /users
POST   /users
PATCH  /users/{user_id}
DELETE /users/{user_id}
POST   /analyze
GET    /result/{filename}
```

`/analyze` dan endpoint user membutuhkan header:

```text
Authorization: Bearer <token>
```

## Warna Marker

- Hijau: normal
- Merah: abnormal
- Kuning/oranye: tidak pasti

Gambar marker hanya memakai garis kontur tanpa label huruf.

## Rule Klasifikasi Awal

Objek dengan area `< 30` diabaikan.

Normal:

```text
circularity >= 0.72
0.70 <= aspect_ratio <= 1.40
solidity >= 0.86
```

Abnormal:

```text
circularity < 0.55
aspect_ratio < 0.55 atau > 1.85
solidity < 0.75
```

Selain kondisi tersebut diklasifikasikan sebagai `uncertain`.

## Batasan

- Tidak ada training model.
- Sistem masuk dan panel admin dibuat untuk penggunaan pribadi, bukan sistem enterprise.
- Segmentasi bergantung pada Cellpose dan kualitas gambar input.
- Klasifikasi morfologi bersifat berbasis aturan dan sederhana.
- AI vision hanya memberi analisis visual tambahan, bukan diagnosis.
- Gambar blur, pencahayaan buruk, artefak preparat, atau perbesaran tidak konsisten dapat mempengaruhi hasil.

## Docker Compose Opsional

Docker Compose menyediakan PostgreSQL, backend, dan frontend:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
docker compose up
```

Setup lokal tetap direkomendasikan untuk instalasi Cellpose/PyTorch yang lebih mudah dikontrol.
