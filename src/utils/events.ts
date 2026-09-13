import { FieldValue } from "firebase-admin/firestore"
import { db } from "../firebase/server"
import { EVENTS_COLLECTION, EVENT_DAILY_COLLECTION, EVENT_USERS_COLLECTION } from "../config/constants"

export type EventType =
  | "sign_in"
  | "sign_out"
  | "dashboard_opened"
  | "application_opened"
  | "application_closed"
  | "submit"
  | "edit"
  | "decision"
  | "withdraw"
  | "status_change"
  | "settings_change"

interface LogEventInput {
  type: EventType
  result: string
  email?: string
  // set when someone acts on another user's record (email = target)
  actor?: string
  detail?: Record<string, unknown>
  request?: Request
  source?: "server" | "client"
}

export const chicagoDay = (date = new Date()) =>
  date.toLocaleDateString("en-CA", { timeZone: "America/Chicago" })

const userSummaryFields = (type: EventType, result: string): Record<string, unknown> => {
  if (type === "sign_in" && result === "success") return { signedIn: true }
  if (type === "application_opened" && result === "new") {
    return { openedApplication: true, submitted: false, lastOpenedAt: FieldValue.serverTimestamp() }
  }
  if (type === "submit" && result === "success") return { submitted: true, submittedAt: FieldValue.serverTimestamp() }
  if (type === "submit") return { failedSubmits: FieldValue.increment(1) }
  return {}
}

// Never throws: logging must not break the request it describes
export async function logEvent({ type, result, email, actor, detail, request, source = "server" }: LogEventInput) {
  try {
    const day = chicagoDay()
    const batch = db.batch()

    batch.set(db.collection(EVENTS_COLLECTION).doc(), {
      type,
      result,
      email: email || null,
      actor: actor || null,
      detail: detail || null,
      source,
      ip: request?.headers.get("x-forwarded-for")?.split(",")[0].trim() || null,
      userAgent: request?.headers.get("user-agent")?.slice(0, 300) || null,
      day,
      at: FieldValue.serverTimestamp(),
    })

    batch.set(db.collection(EVENT_DAILY_COLLECTION).doc(day), {
      day,
      counts: { [`${type}:${result}`]: FieldValue.increment(1) },
      ...(email && !actor && { activeUsers: FieldValue.arrayUnion(email) }),
    }, { merge: true })

    if (email && !actor) {
      batch.set(db.collection(EVENT_USERS_COLLECTION).doc(email), {
        email,
        lastSeenAt: FieldValue.serverTimestamp(),
        ...userSummaryFields(type, result),
      }, { merge: true })
    }

    await batch.commit()
  }
  catch (err) {
    console.error(`Failed to log event ${type}:${result}`, err)
  }
}
