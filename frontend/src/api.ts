export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) }
  });
  const data = response.status === 204 ? undefined : await response.json();
  if (!response.ok) throw new Error(data?.error ?? "Request failed");
  return data as T;
}
