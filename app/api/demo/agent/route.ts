import { NextRequest, NextResponse } from "next/server";

function backendBaseUrl() {
  const baseUrl = process.env.ARISTOTELES_API_URL ?? process.env.BACKEND_URL;
  if (!baseUrl) {
    throw new Error("ARISTOTELES_API_URL is not configured");
  }
  return baseUrl.replace(/\/$/, "");
}

export async function POST(request: NextRequest) {
  try {
    const headers = new Headers();
    const contentType = request.headers.get("content-type");
    if (contentType) {
      headers.set("content-type", contentType);
    }

    const response = await fetch(`${backendBaseUrl()}/v1/demo/agent`, {
      method: "POST",
      headers,
      body: await request.arrayBuffer(),
    });

    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json({ detail: "Backend unavailable" }, { status: 502 });
  }
}
