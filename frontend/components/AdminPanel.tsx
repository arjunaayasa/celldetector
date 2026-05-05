"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
} from "@/lib/api";
import type { User } from "@/lib/types";

type AdminPanelProps = {
  token: string;
  currentUser: User;
};

const emptyForm = {
  email: "",
  full_name: "",
  password: "",
  is_admin: false,
  is_active: true,
};

export function AdminPanel({ token, currentUser }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadUsers() {
    setIsLoading(true);
    setError(null);

    try {
      setUsers(await listUsers(token));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Gagal memuat daftar pengguna.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, [token]);

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await createUser(token, form);
      setForm(emptyForm);
      setMessage("Pengguna berhasil dibuat.");
      await loadUsers();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Gagal membuat pengguna.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleUser(user: User, field: "is_admin" | "is_active") {
    setError(null);
    setMessage(null);

    try {
      await updateUser(token, user.id, { [field]: !user[field] });
      setMessage("Pengguna berhasil diperbarui.");
      await loadUsers();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Gagal memperbarui pengguna.",
      );
    }
  }

  async function handleDeleteUser(user: User) {
    setError(null);
    setMessage(null);

    try {
      await deleteUser(token, user.id);
      setMessage("Pengguna berhasil dihapus.");
      await loadUsers();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Gagal menghapus pengguna.",
      );
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Panel Admin</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Kelola pengguna yang bisa mengakses analisis gambar.
          </p>
        </div>
        <button
          type="button"
          onClick={loadUsers}
          disabled={isLoading}
          className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Memuat..." : "Muat Ulang"}
        </button>
      </div>

      <form
        onSubmit={handleCreateUser}
        className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
      >
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-800">
            Email
          </span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-medical-500 focus:ring-2 focus:ring-medical-100"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-800">
            Nama
          </span>
          <input
            type="text"
            value={form.full_name}
            onChange={(event) => setForm({ ...form, full_name: event.target.value })}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-medical-500 focus:ring-2 focus:ring-medical-100"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-800">
            Kata Sandi
          </span>
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-medical-500 focus:ring-2 focus:ring-medical-100"
            minLength={8}
            required
          />
        </label>

        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.is_admin}
              onChange={(event) =>
                setForm({ ...form, is_admin: event.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-medical-600"
            />
            Admin
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-medical-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-medical-700 active:translate-y-px disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? "Menyimpan..." : "Tambah Pengguna"}
          </button>
        </div>
      </form>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="mt-5 overflow-x-auto rounded-md border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="px-3 py-3">Pengguna</th>
              <th className="px-3 py-3">Peran</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {users.map((user) => {
              const isSelf = user.id === currentUser.id;

              return (
                <tr key={user.id}>
                  <td className="px-3 py-3">
                    <div className="font-medium text-slate-900">{user.full_name}</div>
                    <div className="text-slate-500">{user.email}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
                      {user.is_admin ? "Admin" : "Pengguna"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                        user.is_active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-600"
                      }`}
                    >
                      {user.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleUser(user, "is_admin")}
                        disabled={isSelf}
                        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {user.is_admin ? "Cabut Admin" : "Jadikan Admin"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleUser(user, "is_active")}
                        disabled={isSelf}
                        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {user.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user)}
                        disabled={isSelf}
                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
