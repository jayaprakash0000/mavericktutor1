import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Plus, Send, Trash2, MessageSquare, Square, History, Settings as SettingsIcon, Mail, Phone, Link2, Sun, Moon } from "lucide-react";
import { setTheme } from "@/lib/settings";
import {
  deleteThread,
  deriveTitle,
  getThread,
  loadThreads,
  newThreadId,
  upsertThread,
  type Thread,
} from "@/lib/chat-storage";
import botLogo from "@/assets/bot-logo.png";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/use-settings";


export const Route = createFileRoute("/$threadId")({
  head: () => ({
    meta: [
      { title: "Maverick Tutor" },
      { name: "description", content: "Chat with a multilingual AI tutor in English, Hindi, or Telugu." },
    ],
  }),
  component: ChatPage,
  ssr: false,

});

function ChatPage() {
  const { threadId } = useParams({ from: "/$threadId" });
  return <ChatWindow key={threadId} threadId={threadId} />;
}

function ChatWindow({ threadId }: { threadId: string }) {
  const navigate = useNavigate();
  const settings = useSettings();
  const [threads, setThreads] = useState<Thread[]>(() => loadThreads());
  const avatar = settings.avatarDataUrl || botLogo;


  const initialMessages = useMemo<UIMessage[]>(() => {
    return getThread(threadId)?.messages ?? [];
  }, [threadId]);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );

  const { messages, sendMessage, status, stop, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Persist messages whenever they change
  useEffect(() => {
    if (messages.length === 0) return;
    const thread: Thread = {
      id: threadId,
      title: deriveTitle(messages),
      updatedAt: Date.now(),
      messages,
    };
    upsertThread(thread);
    setThreads(loadThreads());
  }, [messages, threadId]);

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  // Focus composer
  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId, status]);

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    void sendMessage({ text });
  };

  const handleNewThread = () => {
    const id = newThreadId();
    navigate({ to: "/$threadId", params: { threadId: id } });
  };

  const handleDelete = (id: string) => {
    deleteThread(id);
    const remaining = loadThreads();
    setThreads(remaining);
    if (id === threadId) {
      const next = remaining[0]?.id ?? newThreadId();
      navigate({ to: "/$threadId", params: { threadId: next } });
    }
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <img src={avatar} alt="" width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />
          <div className="leading-tight">
            <div className="font-semibold text-sm">{settings.displayName}</div>
            <div className="text-xs text-muted-foreground">EN · हिन्दी · తెలుగు</div>
          </div>
        </div>

        <div className="p-3">
          <button
            onClick={handleNewThread}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {threads.length === 0 && (
            <p className="px-3 py-6 text-xs text-muted-foreground text-center">
              No conversations yet
            </p>
          )}
          {threads.map((t) => {
            const active = t.id === threadId;
            return (
              <div
                key={t.id}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2 py-2 text-sm transition",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/60 text-muted-foreground",
                )}
              >
                <Link
                  to="/$threadId"
                  params={{ threadId: t.id }}
                  className="flex flex-1 items-center gap-2 truncate"
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{t.title}</span>
                </Link>
                <button
                  onClick={() => handleDelete(t.id)}
                  aria-label="Delete chat"
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
        <div className="border-t border-border p-2 space-y-1">
          <Link
            to="/history"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <History className="h-4 w-4" /> History
          </Link>
          <Link
            to="/settings"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <SettingsIcon className="h-4 w-4" /> Settings
          </Link>
          <button
            onClick={() => setTheme(settings.theme === "dark" ? "light" : "dark")}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Toggle theme"
          >
            {settings.theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {settings.theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>
      </aside>


      {/* Main */}
      <main className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <img src={avatar} alt="" width={28} height={28} className="h-7 w-7 rounded-md object-cover" />
            <span className="font-semibold text-sm">{settings.displayName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/history" className="rounded-md p-2 text-muted-foreground hover:bg-accent" aria-label="History">
              <History className="h-4 w-4" />
            </Link>
            <Link to="/settings" className="rounded-md p-2 text-muted-foreground hover:bg-accent" aria-label="Settings">
              <SettingsIcon className="h-4 w-4" />
            </Link>
            <button onClick={handleNewThread} className="rounded-md bg-primary p-2 text-primary-foreground" aria-label="New chat">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </header>


        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-8">
            {messages.length === 0 ? (
              <EmptyState
                settings={settings}
                avatar={avatar}
                onPick={(q) => {
                  setInput("");
                  void sendMessage({ text: q });
                }}
              />
            ) : (
              <div className="space-y-6">
                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m} avatar={avatar} />
                ))}

                {status === "submitted" && (
                  <div className="text-sm text-muted-foreground animate-pulse">Thinking…</div>
                )}
                {error && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    Something went wrong. Please try again.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-background/80 backdrop-blur">
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-3xl items-end gap-2 px-4 py-3"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              rows={1}
              placeholder="Ask in English, हिन्दी, or తెలుగు…"
              className="flex-1 resize-none rounded-xl border border-input bg-card px-4 py-3 text-sm leading-relaxed shadow-sm outline-none ring-ring/20 focus:ring-2 max-h-40"
            />
            {isLoading ? (
              <button
                type="button"
                onClick={() => stop()}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-secondary-foreground"
                aria-label="Stop"
              >
                <Square className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}

function MessageBubble({ message, avatar }: { message: UIMessage; avatar: string }) {
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <img src={avatar} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-lg object-cover" />
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "text-foreground",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{text}</p>
        ) : (
          <div className="space-y-2 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-xs [&_pre]:overflow-x-auto [&_strong]:font-semibold">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

const SAMPLES = [
  "What is machine learning?",
  "एआई कैसे काम करता है?",
  "గురుత్వాకర్షణ గురించి చెప్పండి",
  "Explain neural networks step by step",
];

function EmptyState({
  onPick,
  settings,
  avatar,
}: {
  onPick: (q: string) => void;
  settings: ReturnType<typeof useSettings>;
  avatar: string;
}) {
  const hasContact = settings.contactEmail || settings.contactPhone || settings.contactSocial;
  return (
    <div className="flex flex-col items-center text-center py-12">
      <img src={avatar} alt="" width={96} height={96} className="h-24 w-24 rounded-2xl object-cover mb-4" />
      <h1 className="text-2xl font-semibold tracking-tight">{settings.displayName}</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground whitespace-pre-wrap">
        {settings.welcomeMessage}
      </p>
      {settings.mode === "human" && (
        <p className="mt-3 rounded-md bg-accent px-3 py-1.5 text-xs text-accent-foreground">
          Live chat mode — messages will be routed to a human agent.
        </p>
      )}
      <div className="mt-6 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
        {SAMPLES.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm text-foreground transition hover:bg-accent"
          >
            {s}
          </button>
        ))}
      </div>
      {hasContact && (
        <div className="mt-8 w-full max-w-xl rounded-xl border border-border bg-card p-4 text-left">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Other ways to reach us
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {settings.contactEmail && (
              <a href={`mailto:${settings.contactEmail}`} className="inline-flex items-center gap-1.5 text-foreground hover:text-primary">
                <Mail className="h-4 w-4" /> {settings.contactEmail}
              </a>
            )}
            {settings.contactPhone && (
              <a href={`tel:${settings.contactPhone}`} className="inline-flex items-center gap-1.5 text-foreground hover:text-primary">
                <Phone className="h-4 w-4" /> {settings.contactPhone}
              </a>
            )}
            {settings.contactSocial && (
              <a href={settings.contactSocial} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-foreground hover:text-primary">
                <Link2 className="h-4 w-4" /> Social
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

