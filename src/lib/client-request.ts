/** A failed write must never be displayed as a successful save. */
export async function requestJson<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, signal: init?.signal ?? AbortSignal.timeout(30_000) });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(response.status === 401
      ? "Your session expired. Sign in again, then retry."
      : "The change could not be saved. Please retry or refresh to check its status.");
  }
  return body as T;
}
