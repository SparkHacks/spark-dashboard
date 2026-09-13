import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { app } from "../../firebase/server";
import { logEvent } from "../../utils/events";

const MAX_DURATION_SEC = 24 * 60 * 60;

// Client-reported events only; anything that proves an action is logged server-side
export const POST: APIRoute = async ({ request, cookies }) => {
  const sessionCookie = cookies.get("__session")?.value;
  if (!sessionCookie) {
    return new Response(null, { status: 401 });
  }

  const decodedCookie = await getAuth(app).verifySessionCookie(sessionCookie).catch(() => null);
  if (!decodedCookie?.email) {
    return new Response(null, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (body?.type !== "application_closed") {
    return new Response(null, { status: 400 });
  }

  const durationSec = Math.min(Math.max(Math.round(Number(body.durationSec) || 0), 0), MAX_DURATION_SEC);
  await logEvent({
    type: "application_closed",
    result: body.submitted ? "after_submit" : "left",
    email: decodedCookie.email,
    detail: { durationSec, registered: Boolean(body.registered) },
    request,
    source: "client",
  });

  return new Response(null, { status: 204 });
};
