import type {
  AnalyzeResponse,
  AuthResponse,
  CreateUserPayload,
  UpdateUserPayload,
  User,
} from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function joinUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export function buildResultImageUrl(markedImageUrl: string): string {
  return joinUrl(API_BASE_URL, markedImageUrl);
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await response.json();
    if (typeof payload.detail === "string") {
      return payload.detail;
    }
  } catch {
    const text = await response.text();
    if (text) {
      return text;
    }
  }

  return fallback;
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(joinUrl(API_BASE_URL, "/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Gagal masuk."));
  }

  return response.json();
}

export async function getCurrentUser(token: string): Promise<User> {
  const response = await fetch(joinUrl(API_BASE_URL, "/auth/me"), {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Sesi tidak valid."));
  }

  return response.json();
}

export async function listUsers(token: string): Promise<User[]> {
  const response = await fetch(joinUrl(API_BASE_URL, "/users"), {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Gagal memuat pengguna."));
  }

  return response.json();
}

export async function createUser(
  token: string,
  payload: CreateUserPayload,
): Promise<User> {
  const response = await fetch(joinUrl(API_BASE_URL, "/users"), {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Gagal membuat pengguna."));
  }

  return response.json();
}

export async function updateUser(
  token: string,
  userId: number,
  payload: UpdateUserPayload,
): Promise<User> {
  const response = await fetch(joinUrl(API_BASE_URL, `/users/${userId}`), {
    method: "PATCH",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Gagal memperbarui pengguna."));
  }

  return response.json();
}

export async function deleteUser(token: string, userId: number): Promise<void> {
  const response = await fetch(joinUrl(API_BASE_URL, `/users/${userId}`), {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Gagal menghapus pengguna."));
  }
}

export async function analyzeImage(
  file: File,
  token: string,
): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(joinUrl(API_BASE_URL, "/analyze"), {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Analisis gambar gagal."));
  }

  return response.json();
}

export async function exportResultImage(markedImageUrl: string): Promise<void> {
  const url = buildResultImageUrl(markedImageUrl);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Gagal mengekspor gambar hasil.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const filename = markedImageUrl.split("/").pop() || "hasil-marker.png";

  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
