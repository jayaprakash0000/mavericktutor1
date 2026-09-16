import type { UIMessage } from "ai";

const KEY = "chatbot.threads.v1";

export type Thread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
};

function readAll(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Thread[];
  } catch {
    return [];
  }
}

function writeAll(threads: Thread[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(threads));
}

export function loadThreads(): Thread[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getThread(id: string): Thread | undefined {
  return readAll().find((t) => t.id === id);
}

export function upsertThread(thread: Thread) {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === thread.id);
  if (idx >= 0) all[idx] = thread;
  else all.push(thread);
  writeAll(all);
}

export function deleteThread(id: string) {
  writeAll(readAll().filter((t) => t.id !== id));
}

export function newThreadId() {
  return (
    "t_" +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

export function deriveTitle(messages: UIMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New chat";
  const text = first.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .trim();
  return text.slice(0, 48) || "New chat";
}
