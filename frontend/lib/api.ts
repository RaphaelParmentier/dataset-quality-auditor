export async function postFormData<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? "Erreur API inconnue.");
  }

  return response.json();
}

export async function postJson<T>(
  endpoint: string,
  payload: unknown
): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    throw new Error(errorPayload?.detail ?? "Erreur API inconnue.");
  }

  return response.json();
}