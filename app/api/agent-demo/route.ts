export const runtime = "nodejs";

export async function POST(request: Request) {
  const apiUrl = process.env.ARISTOTELES_API_URL ?? process.env.NEXT_PUBLIC_ARISTOTELES_API_URL;

  if (!apiUrl) {
    return Response.json(
      { error: "ARISTOTELES_API_URL is not configured" },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const upstream = `${apiUrl.replace(/\/$/, "")}/v1/demo/agent`;

  try {
    const response = await fetch(upstream, {
      method: "POST",
      body: formData,
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const payload = await response.json();
      return Response.json(payload, { status: response.status });
    }

    return Response.json(
      { error: await response.text() },
      { status: response.status },
    );
  } catch {
    return Response.json(
      { error: "Agent backend is not reachable" },
      { status: 503 },
    );
  }
}
