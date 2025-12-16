export const config = {
  runtime: "edge",
};

// 16-12-2025 Ghaith's Change Start


const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "models/gemini-2.5-flash-preview-09-2025";

export default async function handler(req) {
  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY is not set on the server." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }

  try {
    const body = await req.json();
    const { prompt, history } = body || {};

    // history is already in Gemini content format from your frontend:
    // [{ role: "user"|"model", parts: [{ text: "..." }] }, ...]
    const contents = Array.isArray(history) && history.length > 0
      ? history
      : [
          {
            role: "user",
            parts: [{ text: prompt || "" }],
          },
        ];

    const upstreamRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:streamGenerateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // You can add safety settings / generationConfig here if needed
        body: JSON.stringify({ contents }),
      }
    );

    if (!upstreamRes.ok || !upstreamRes.body) {
      const errText = await upstreamRes.text().catch(() => "");
      return new Response(
        JSON.stringify({
          error:
            errText ||
            upstreamRes.statusText ||
            "Gemini streaming request failed.",
        }),
        {
          status: upstreamRes.status || 500,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder("utf-8");

    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstreamRes.body.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Gemini streaming API typically returns JSON chunks separated by newlines
            let newlineIndex;
            while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
              const line = buffer.slice(0, newlineIndex).trim();
              buffer = buffer.slice(newlineIndex + 1);

              if (!line) continue;

              try {
                const json = JSON.parse(line);
                // Extract any text parts from the chunk
                const candidates = json.candidates || [];
                for (const cand of candidates) {
                  const parts = cand.content?.parts || [];
                  for (const part of parts) {
                    if (part.text) {
                      controller.enqueue(encoder.encode(part.text));
                    }
                  }
                }
              } catch (e) {
                // If parsing fails, you can log it but don't break the whole stream
                console.error("Failed to parse Gemini stream chunk:", e);
              }
            }
          }
        } catch (err) {
          console.error("Error while reading Gemini stream:", err);
          controller.error(err);
          return;
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("Edge proxy error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error in edge Gemini proxy." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }
}
// 16-12-2025 Ghaith's Change End
