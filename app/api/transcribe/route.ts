export const runtime = "nodejs";

export async function POST(request: Request) {
  const apiUrl =
    process.env.ARISTOTELES_API_URL ??
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_ARISTOTELES_API_URL;

  if (!apiUrl) {
    return Response.json(
      { error: "ARISTOTELES_API_URL is not configured" },
      { status: 503 },
    );
  }

  const headers = new Headers();
  const sharedSecret = process.env.ARISTOTELES_API_SHARED_SECRET;
  if (sharedSecret) {
    headers.set("x-aristoteles-proxy", sharedSecret);
  }

  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/v1/audio/transcriptions`, {
      method: "POST",
      headers,
      body: await request.formData(),
      cache: "no-store",
    });
    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : { error: await response.text() };
    return Response.json(payload, { status: response.status });
  } catch {
    return Response.json(
      { error: "Transcription backend is not reachable" },
      { status: 503 },
    );
  }
}
