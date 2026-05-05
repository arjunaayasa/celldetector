"use client";

import { FormEvent, useState } from "react";

type LoginPanelProps = {
  isLoading: boolean;
  error: string | null;
  onLogin: (email: string, password: string) => Promise<void>;
};

export function LoginPanel({ isLoading, error, onLogin }: LoginPanelProps) {
  const [email, setEmail] = useState("admin@bloodcell.local");
  const [password, setPassword] = useState("admin12345");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onLogin(email, password);
  }

  return (
    <main className="min-h-[100dvh] bg-slate-50 px-4 py-8 text-slate-900 md:px-6">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-medical-700">
              Akses pengguna
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Blood Cell Morphology Marker
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Masuk untuk mengunggah gambar mikroskop, melihat hasil marker, dan
              mengelola pengguna melalui panel admin.
            </p>
            <div className="mt-6 rounded-md border border-medical-100 bg-medical-50 px-4 py-3 text-sm leading-6 text-medical-700">
              Aplikasi ini hanya untuk penapisan visual pribadi dan edukasi, bukan
              diagnosis medis.
            </div>
          </section>

          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel"
          >
            <h2 className="text-lg font-semibold text-slate-950">Masuk</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Gunakan akun admin awal dari konfigurasi backend.
            </p>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-medium text-slate-800">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isLoading}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-medical-500 focus:ring-2 focus:ring-medical-100 disabled:cursor-not-allowed disabled:opacity-60"
                required
              />
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium text-slate-800">
                Kata Sandi
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-medical-500 focus:ring-2 focus:ring-medical-100 disabled:cursor-not-allowed disabled:opacity-60"
                minLength={8}
                required
              />
            </label>

            {error ? (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-medical-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-medical-700 active:translate-y-px disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
