import { supabase } from "@/lib/supabase";

type StoredChatMessage = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  result: unknown;
  created_at: string;
};

export async function getCurrentUserId() {
  if (!supabase) {
    return null;
  }
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }
  return data.user?.id ?? null;
}

export async function getOrCreateChatSession(currentSessionId: string | null, title: string) {
  if (!supabase) {
    return null;
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }
  if (currentSessionId) {
    return currentSessionId;
  }
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      owner_id: userId,
      title: title.slice(0, 120) || "Nuevo chat",
    })
    .select("id")
    .single();
  if (error) {
    console.warn("Could not create chat session", error);
    return null;
  }
  return data.id as string;
}

export async function saveChatMessage(input: {
  sessionId: string | null;
  title: string;
  role: "user" | "assistant";
  content: string;
  result?: unknown;
}) {
  if (!supabase) {
    return null;
  }
  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }
  const sessionId = await getOrCreateChatSession(input.sessionId, input.title);
  if (!sessionId) {
    return null;
  }
  const { error } = await supabase.from("chat_messages").insert({
    owner_id: userId,
    session_id: sessionId,
    role: input.role,
    content: input.content,
    result: input.result ?? null,
  });
  if (error) {
    console.warn("Could not save chat message", error);
  }
  return sessionId;
}

export function subscribeToChatMessages(
  sessionId: string,
  onInsert: (message: StoredChatMessage) => void,
) {
  if (!supabase) {
    return () => undefined;
  }
  const client = supabase;
  const channel = client
    .channel(`chat-session-${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => onInsert(payload.new as StoredChatMessage),
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
