// netlify/functions/claude.js
// Serverless proxy — keeps ANTHROPIC_API_KEY server-side, never exposed in browser.
// Set ANTHROPIC_API_KEY in Netlify dashboard → Site Settings → Environment Variables.

export default async (req, context) => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Forward to Anthropic — pass through the full request body as-is.
  // This supports: prompt caching (cache_control), web search (tools),
  // streaming, and any other Anthropic API features.
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      // Required for prompt caching and web search tool
      "anthropic-beta": "prompt-caching-2024-07-31",
    },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();

  return new Response(JSON.stringify(data), {
    status: upstream.status,
    headers: {
      "Content-Type": "application/json",
      // Prevent browser caching of API responses
      "Cache-Control": "no-store",
    },
  });
};

export const config = {
  path: "/api/claude",
};
