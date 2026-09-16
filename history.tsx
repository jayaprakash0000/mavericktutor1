import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { MessageSquare, Plus, Trash2, ArrowLeft } from "lucide-react";
import { deleteThread, loadThreads, newThreadId } from "@/lib/chat-storage";
import { useState } from "react";
import botLogo from "@/assets/bot-logo.png";
import { useSettings } from "@/hooks/use-settings";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Chat History — Maverick Tutor" },
      { name: "description", content: "Browse and manage all your past conversations." },
    ],
  }),
  component: HistoryPage,
  ssr: false,
});

function HistoryPage() {
  const [threads, setThreads] = useState(() => loadThreads());
  const settings = useSettings();
  const newId = useMemo(() => newThreadId(), []);

  const handleDelete = (id: string) => {
    deleteThread(id);
    setThreads(loadThreads());
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to chat
          </Link>
          <Link
            to="/$threadId"
            params={{ threadId: newId }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New chat
          </Link>
        </div>

        <div className="mb-8 flex items-center gap-3">
          <img
            src={settings.avatarDataUrl || botLogo}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 rounded-xl object-cover"
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Chat History</h1>
            <p className="text-sm text-muted-foreground">{threads.length} conversation{threads.length === 1 ? "" : "s"}</p>
          </div>
        </div>

        {threads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No conversations yet. Start your first chat.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {threads.map((t) => {
              const preview = t.messages
                .slice(-1)
                .map((m) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join(""))
                .join("") || "—";
              return (
                <li key={t.id} className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40">
                  <Link
                    to="/$threadId"
                    params={{ threadId: t.id }}
                    className="flex-1 min-w-0"
                  >
                    <div className="font-medium truncate">{t.title}</div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">{preview}</div>
                    <div className="text-[11px] text-muted-foreground/70 mt-1">
                      {new Date(t.updatedAt).toLocaleString()} · {t.messages.length} messages
                    </div>
                  </Link>
                  <button
                    onClick={() => handleDelete(t.id)}
                    aria-label="Delete"
                    className="rounded-md p-2 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
