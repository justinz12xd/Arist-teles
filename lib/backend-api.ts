function backendBaseUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_ARISTOTELES_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_ARISTOTELES_API_URL is not configured");
  }

  return baseUrl.replace(/\/$/, "");
}

export function agentDemoUrl() {
  return `${backendBaseUrl()}/v1/demo/agent`;
}

export function chatResearchUrl() {
  return `${backendBaseUrl()}/v1/chat/research`;
}
