import type { APIRoute } from "astro";

const API_HOST = "https://us.i.posthog.com";
const ASSET_HOST = "https://us-assets.i.posthog.com";

// Same-origin proxy so ad blockers don't drop PostHog requests
export const ALL: APIRoute = async ({ request, params, url }) => {
  const path = params.path || "";
  const host = path.startsWith("static/") || path.startsWith("array/") ? ASSET_HOST : API_HOST;

  const headers = new Headers();
  for (const name of ["content-type", "user-agent", "accept"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
  if (clientIp) headers.set("x-forwarded-for", clientIp);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const upstream = await fetch(`${host}/${path}${url.search}`, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
};
