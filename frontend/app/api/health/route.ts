const BACKEND_URL = "https://ai-data-report-generator-zn71.onrender.com";

export async function GET() {
  try {
    const response = await fetch(BACKEND_URL, {
      method: "GET",
      cache: "no-store",
    });

    const data = await response.json();

    return Response.json(
      {
        status: response.ok ? "ok" : "error",
        backend: data,
      },
      { status: response.status }
    );
  } catch (error) {
    return Response.json(
      {
        status: "error",
        detail:
          error instanceof Error
            ? error.message
            : "Unknown health check error.",
      },
      { status: 500 }
    );
  }
}