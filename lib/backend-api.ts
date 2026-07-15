function publicBackendBaseUrl() {
  return process.env.NEXT_PUBLIC_ARISTOTELES_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL;
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

export function agentDemoUrl() {
  const baseUrl = publicBackendBaseUrl();
  return baseUrl ? `${normalizeBaseUrl(baseUrl)}/v1/demo/agent` : "/api/demo/agent";
}

export function chatResearchUrl() {
  const baseUrl = publicBackendBaseUrl();
  return baseUrl ? `${normalizeBaseUrl(baseUrl)}/v1/chat/research` : "/api/chat/research";
}
