import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { loadThreads, newThreadId } from "@/lib/chat-storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maverick Tutor" },
      { name: "description", content: "A multilingual AI tutor that explains AI, ML, and science in English, Hindi, and Telugu." },
    ],
  }),
  component: IndexRedirect,
  ssr: false,

});

function IndexRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const threads = loadThreads();
    const id = threads[0]?.id ?? newThreadId();
    navigate({ to: "/$threadId", params: { threadId: id }, replace: true });
  }, [navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      Loading…
    </div>
  );
}
