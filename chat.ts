import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import knowledge from "@/lib/knowledge.json";

const knowledgeText = (knowledge as [string, string][])
  .map(([q, a]) => `Q: ${q}\nA: ${a}`)
  .join("\n\n");

const SYSTEM_PROMPT = `You are a friendly multilingual educational assistant that explains concepts in AI, machine learning, physics, computing and general science.

You can answer in English, Hindi (हिन्दी), or Telugu (తెలుగు). Detect the user's language from their question and respond in the same language and script. If they ask "in hindi" / "in telugu" / "in english", answer in that language.

Keep answers clear, concise, and step-by-step when the question asks "how" or "steps". Use markdown formatting (lists, bold) when helpful.

Below is a reference knowledge base of example question/answer pairs you were trained on. Use them as a stylistic and factual guide, but you may go beyond them to answer related questions:

${knowledgeText}`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) {
          return new Response("Messages required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        try {
          const result = streamText({
            model: gateway("google/gemini-3-flash-preview"),
            system: SYSTEM_PROMPT,
            messages: await convertToModelMessages(messages),
          });
          return result.toUIMessageStreamResponse({ originalMessages: messages });
        } catch (err) {
          console.error("chat error", err);
          return new Response("AI error", { status: 500 });
        }
      },
    },
  },
});
