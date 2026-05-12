const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://ai-data-report-generator-zr71.onrender.com";

export async function postFormData<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? "Erreur API inconnue.");
  }

  return response.json();
}