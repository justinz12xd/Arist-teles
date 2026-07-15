type LocalChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  result?: unknown;
  createdAt: string;
};

export type LocalChatSession = {
  id: string;
  title: string;
  preview: string;
  messages: LocalChatMessage[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "aristoteles.chat.sessions.v1";

function readSessions(): LocalChatSession[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions: LocalChatSession[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 30)));
}

export function listLocalChatSessions() {
  return readSessions().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getLocalChatSession(sessionId: string) {
  return readSessions().find((session) => session.id === sessionId) ?? null;
}

export function saveLocalChatMessage(input: {
  sessionId: string | null;
  role: "user" | "assistant";
  content: string;
  result?: unknown;
}) {
  const now = new Date().toISOString();
  const sessions = readSessions();
  const existingIndex = input.sessionId
    ? sessions.findIndex((session) => session.id === input.sessionId)
    : -1;
  const message: LocalChatMessage = {
    id: crypto.randomUUID(),
    role: input.role,
    content: input.content,
    result: input.result,
    createdAt: now,
  };

  if (existingIndex >= 0) {
    const session = sessions[existingIndex];
    const messages = [...session.messages, message];
    sessions[existingIndex] = {
      ...session,
      preview: input.content.slice(0, 120),
      messages,
      updatedAt: now,
    };
    writeSessions(sessions);
    return session.id;
  }

  const session: LocalChatSession = {
    id: crypto.randomUUID(),
    title: input.content.slice(0, 80) || "Nuevo chat",
    preview: input.content.slice(0, 120),
    messages: [message],
    createdAt: now,
    updatedAt: now,
  };
  writeSessions([session, ...sessions]);
  return session.id;
}

export function deleteLocalChatSession(sessionId: string) {
  writeSessions(readSessions().filter((session) => session.id !== sessionId));
}
