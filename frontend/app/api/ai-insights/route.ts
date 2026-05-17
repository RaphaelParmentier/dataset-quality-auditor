const BACKEND_URL = "https://ai-data-report-generator-zn71.onrender.com";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const response = await fetch(`${BACKEND_URL}/ai-insights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    return Response.json(
      {
        detail:
          error instanceof Error
            ? error.message
            : "Unknown error while calling AI insights API.",
      },
      { status: 500 }
    );
  }
}