"use client";

import { useEffect, useMemo, useState } from "react";

import { AdminPanel } from "@/components/AdminPanel";
import { AIAnalysis } from "@/components/AIAnalysis";
import { CellsTable } from "@/components/CellsTable";
import { LoginPanel } from "@/components/LoginPanel";
import { MarkedImage } from "@/components/MarkedImage";
import { ResultSummary } from "@/components/ResultSummary";
import { UploadPanel } from "@/components/UploadPanel";
import { analyzeImage, getCurrentUser, loginUser } from "@/lib/api";
import type { AnalyzeResponse, CellResult, User } from "@/lib/types";

const TOKEN_STORAGE_KEY = "blood-cell-marker-token";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [selectedCellId, setSelectedCellId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!savedToken) {
      setAuthLoading(false);
      return;
    }

    setToken(savedToken);
    getCurrentUser(savedToken)
      .then((user) => setCurrentUser(user))
      .catch(() => {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setCurrentUser(null);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const hasResult = useMemo(() => result !== null, [result]);
  const selectedCell = useMemo(() => {
    if (!result || selectedCellId === null) {
      return null;
    }

    return result.cells.find((cell) => cell.cell_id === selectedCellId) ?? null;
  }, [result, selectedCellId]);

  async function handleLogin(email: string, password: string) {
    setLoginLoading(true);
    setLoginError(null);

    try {
      const response = await loginUser(email, password);
      window.localStorage.setItem(TOKEN_STORAGE_KEY, response.access_token);
      setToken(response.access_token);
      setCurrentUser(response.user);
    } catch (caughtError) {
      setLoginError(
        caughtError instanceof Error ? caughtError.message : "Gagal masuk.",
      );
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setCurrentUser(null);
    setSelectedFile(null);
    setResult(null);
    setSelectedCellId(null);
    setError(null);
  }

  async function handleAnalyze() {
    if (!selectedFile || isLoading || !token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await analyzeImage(selectedFile, token);
      setResult(response);
      setSelectedCellId(null);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Gambar tidak bisa dianalisis.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileChange(file: File | null) {
    setSelectedFile(file);
    setResult(null);
    setSelectedCellId(null);
    setError(null);
  }

  function handleSelectCell(cell: CellResult) {
    setSelectedCellId(cell.cell_id);
    window.requestAnimationFrame(() => {
      document
        .getElementById("marked-image-section")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  if (authLoading) {
    return (
      <main className="min-h-[100dvh] bg-slate-50 px-4 py-8 text-slate-900 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="h-4 w-44 rounded bg-slate-200" />
            <div className="mt-4 h-24 rounded-md bg-slate-100" />
          </div>
        </div>
      </main>
    );
  }

  if (!token || !currentUser) {
    return (
      <LoginPanel
        isLoading={loginLoading}
        error={loginError}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <main className="min-h-[100dvh] bg-slate-50 px-4 py-6 text-slate-900 md:px-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 border-b border-slate-200 pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-medical-700">
                Alat edukasi pribadi
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Blood Cell Morphology Marker
              </h1>
              <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
                Alat penapisan visual untuk morfologi sel darah merah
              </p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <div className="rounded-md border border-medical-100 bg-medical-50 px-4 py-3 text-sm leading-6 text-medical-700">
                Bukan diagnosis medis. Gunakan output hanya untuk pembelajaran dan
                tinjauan visual.
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span>
                  Masuk sebagai{" "}
                  <span className="font-semibold text-slate-900">
                    {currentUser.full_name}
                  </span>
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                  {currentUser.is_admin ? "Admin" : "Pengguna"}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:translate-y-px"
                >
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <UploadPanel
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            isLoading={isLoading}
            error={error}
            onFileChange={handleFileChange}
            onAnalyze={handleAnalyze}
          />
          <ResultSummary summary={result?.summary ?? null} />
        </div>

        {isLoading ? (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="mt-4 h-[280px] rounded-md bg-slate-100" />
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="h-16 rounded-md bg-slate-100" />
              <div className="h-16 rounded-md bg-slate-100" />
              <div className="h-16 rounded-md bg-slate-100" />
            </div>
          </section>
        ) : null}

        {hasResult && result ? (
          <div className="mt-6 grid gap-6">
            <MarkedImage
              markedImageUrl={result.marked_image_url}
              selectedCell={selectedCell}
            />
            <AIAnalysis analysis={result.ai_analysis} />
            <CellsTable
              cells={result.cells}
              selectedCellId={selectedCellId}
              onSelectCell={handleSelectCell}
            />
          </div>
        ) : null}

        {currentUser.is_admin ? (
          <div className="mt-6">
            <AdminPanel token={token} currentUser={currentUser} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
