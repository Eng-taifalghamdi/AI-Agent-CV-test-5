export const config = {
  runtime: "edge",
};

// 16-12-2025 Ghaith's Change Start
// Legacy backend URL (existing non-streaming Gemini proxy you used before)
const LEGACY_BACKEND_URL =
  "https://backend-vercel-repo-git-main-jouds-projects-8f56041e.vercel.app/api/gemini-proxy";

export default async function handler(req) {
  try {
    const body = await req.json();

    // Forward request to the existing backend that already talks to Gemini
    const upstreamRes = await fetch(LEGACY_BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!upstreamRes.ok) {
      const errorText = await upstreamRes.text();
      return new Response(
        JSON.stringify({
          error: errorText || upstreamRes.statusText,
        }),
        {
          status: upstreamRes.status,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
    }

    const data = await upstreamRes.json();
    const text = data.text || "";

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Stream the real model text as a single chunk for now
        controller.enqueue(encoder.encode(text));
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
      JSON.stringify({ error: "Internal error in edge proxy." }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      }
    );
  }
}
// 16-12-2025 Ghaith's Change End


