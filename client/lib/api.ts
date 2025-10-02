export function getApiBase(): string {
  // Prefer explicit env at build-time
  const envBase = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
  if (envBase) return envBase.replace(/\/$/, "");
  // Allow runtime override (e.g., window.__API_BASE__ = "https://api.example.com")
  // @ts-ignore
  const runtime = typeof window !== "undefined" ? (window as any).__API_BASE__ : undefined;
  if (runtime) return String(runtime).replace(/\/$/, "");
  // Default to same-origin
  return "";
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  if (!path.startsWith("/")) path = "/" + path;
  return `${base}${path}`;
}

export async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}
