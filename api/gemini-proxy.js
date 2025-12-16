// api/gemini-proxy.js

export const config = {
  runtime: "edge", // Important: Edge runtime supports streaming well
};

export default async function handler(req) {
  // Read JSON body sent from your frontend
  const body = await req.json();
  const { prompt, history } = body || {};

  // For now, we'll just stream a fake response to prove streaming works.
  // Later you can replace this with a real call to Gemini's streaming API.
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode("Thinking about your question...\n"));
        await new Promise((r) => setTimeout(r, 500));

        controller.enqueue(
          encoder.encode("First part of the answer based on your prompt.\n")
        );
        await new Promise((r) => setTimeout(r, 500));

        controller.enqueue(
          encoder.encode("Second part of the answer.\nDone.\n")
        );

        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
