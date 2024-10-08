// app/api/assistants/threads/[threadId]/messages/route.ts

import { assistantId } from "@/app/assistant-config";
import { openai } from "@/app/openai";

export const runtime = "nodejs";

// Send a new message to a thread
type Run = {
  status: string; // Asigură-te că tipul `status` include 'running' ca posibilă valoare
};

  export async function POST(request, { params: { threadId } }) {
    const formData = await request.formData();
    const content = formData.get('content');

    try {
      const runs = await openai.beta.threads.runs.list(threadId);
      const activeRun = runs.data.find((run: Run) => run.status === "running");
      if (activeRun) {
        console.log(`Active run detected on thread ${threadId}`);
        return new Response(JSON.stringify({ error: "Run activ pe thread." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: content,
      });
      console.log(`Message added to thread ${threadId}`);

      const stream = await openai.beta.threads.runs.stream(threadId, {
        assistant_id: assistantId,
      });
      console.log(`Starting run for thread ${threadId}`);

      const headers = new Headers();
      headers.append("Content-Type", "text/event-stream");
      headers.append("Cache-Control", "no-cache");
      headers.append("Connection", "keep-alive");

      return new Response(stream.toReadableStream(), {
        headers,
      });
    } catch (error) {
      console.error("Error in route:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }