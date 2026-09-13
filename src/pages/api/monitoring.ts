import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import { app, db } from "../../firebase/server";
import getRoleFlags from "../../scripts/getRoles";
import { chicagoDay } from "../../utils/events";
import { EVENTS_COLLECTION, EVENT_DAILY_COLLECTION, EVENT_USERS_COLLECTION, FORMS_COLLECTION } from "../../config/constants";

const auth = getAuth(app);
const FEED_PAGE_SIZE = 50;
const FEED_SCAN_SIZE = 300;
const DAY_MS = 24 * 60 * 60 * 1000;

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });

const toMillis = (value: unknown) => (value instanceof Timestamp ? value.toMillis() : null);

const serializeEvent = (doc: DocumentSnapshot) => {
  const data = doc.data() || {};
  return {
    id: doc.id,
    type: data.type,
    result: data.result,
    email: data.email,
    actor: data.actor,
    detail: data.detail,
    source: data.source,
    ip: data.ip,
    userAgent: data.userAgent,
    at: toMillis(data.at),
  };
};

const lastDays = (count: number) => {
  const today = Date.parse(`${chicagoDay()}T00:00:00Z`);
  return Array.from({ length: count }, (_, i) =>
    new Date(today - (count - 1 - i) * DAY_MS).toISOString().slice(0, 10)
  );
};

const getOverview = async (dayCount: number) => {
  const days = lastDays(Math.min(Math.max(dayCount, 1), 60));
  const snaps = await db.getAll(...days.map(day => db.collection(EVENT_DAILY_COLLECTION).doc(day)));

  const activeDaysByUser = new Map<string, number>();
  const daily = snaps.map((snap, i) => {
    const data = snap.data();
    const users: string[] = data?.activeUsers || [];
    users.forEach(email => activeDaysByUser.set(email, (activeDaysByUser.get(email) || 0) + 1));
    return { day: days[i], counts: (data?.counts || {}) as Record<string, number>, activeUsers: users.length };
  });

  const users = db.collection(EVENT_USERS_COLLECTION);
  const countFlag = async (field: string) => (await users.where(field, "==", true).count().get()).data().count;
  const [signedIn, openedApplication, submitted] = await Promise.all([
    countFlag("signedIn"),
    countFlag("openedApplication"),
    countFlag("submitted"),
  ]);

  return {
    daily,
    activeUsers: activeDaysByUser.size,
    returningUsers: [...activeDaysByUser.values()].filter(n => n >= 2).length,
    funnel: { signedIn, openedApplication, submitted },
  };
};

const getUserActivity = async (email: string) => {
  const [eventsSnap, formSnap, authUser] = await Promise.all([
    db.collection(EVENTS_COLLECTION).where("email", "==", email).limit(500).get(),
    db.collection(FORMS_COLLECTION).doc(email).get(),
    auth.getUserByEmail(email).catch(() => null),
  ]);
  const form = formSnap.data();

  return {
    email,
    events: eventsSnap.docs.map(serializeEvent).sort((a, b) => (b.at ?? 0) - (a.at ?? 0)),
    account: authUser && {
      createdAt: Date.parse(authUser.metadata.creationTime),
      lastSignInAt: authUser.metadata.lastSignInTime ? Date.parse(authUser.metadata.lastSignInTime) : null,
    },
    application: form ? { appStatus: form.appStatus, submittedAt: toMillis(form.createdAt) } : null,
  };
};

const getFeed = async (type: string | null, before: number | null) => {
  let feedQuery = db.collection(EVENTS_COLLECTION).orderBy("at", "desc");
  if (before) feedQuery = feedQuery.startAfter(Timestamp.fromMillis(before));

  // filter in memory so no composite index is needed
  const scanSize = type ? FEED_SCAN_SIZE : FEED_PAGE_SIZE;
  const snap = await feedQuery.limit(scanSize).get();
  const events = snap.docs.map(serializeEvent).filter(e => !type || e.type === type).slice(0, FEED_PAGE_SIZE);

  let nextCursor: number | null = null;
  if (events.length === FEED_PAGE_SIZE) nextCursor = events[events.length - 1].at;
  else if (snap.size === scanSize) nextCursor = toMillis(snap.docs[snap.size - 1].data().at);

  return { events, nextCursor };
};

const getDropoffs = async () => {
  const snap = await db.collection(EVENT_USERS_COLLECTION)
    .where("openedApplication", "==", true)
    .where("submitted", "==", false)
    .limit(500)
    .get();

  const users = snap.docs.map(doc => {
    const data = doc.data();
    return {
      email: doc.id,
      lastOpenedAt: toMillis(data.lastOpenedAt),
      lastSeenAt: toMillis(data.lastSeenAt),
      failedSubmits: data.failedSubmits || 0,
    };
  });
  return { users: users.sort((a, b) => (b.lastOpenedAt ?? 0) - (a.lastOpenedAt ?? 0)) };
};

export const GET: APIRoute = async ({ cookies, url }) => {
  const sessionCookie = cookies.get("__session")?.value;
  if (!sessionCookie) {
    return new Response("No token found", { status: 401 });
  }

  try {
    const decodedCookie = await auth.verifySessionCookie(sessionCookie);
    const roles = getRoleFlags(await auth.getUser(decodedCookie.uid));
    if (!roles.isAdmin && !roles.isWebDev) {
      return new Response("Unauthorized", { status: 403 });
    }
  }
  catch (err) {
    console.error("Error verifying session:", err);
    return new Response("Session expired", { status: 401 });
  }

  try {
    const params = url.searchParams;
    switch (params.get("view")) {
      case "overview":
        return json(await getOverview(Number(params.get("days")) || 14));
      case "user": {
        const email = params.get("email")?.trim().toLowerCase();
        if (!email) return new Response("Email is required", { status: 400 });
        return json(await getUserActivity(email));
      }
      case "feed":
        return json(await getFeed(params.get("type") || null, Number(params.get("before")) || null));
      case "dropoffs":
        return json(await getDropoffs());
      default:
        return new Response("Invalid view", { status: 400 });
    }
  }
  catch (err) {
    console.error("Monitoring query failed:", err);
    return new Response("Something is wrong with server", { status: 500 });
  }
};
