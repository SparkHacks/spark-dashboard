import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { app, db } from "../../../firebase/server";
import { FORMS_COLLECTION } from "../../../utils/utils";
import { logEvent } from "../../../utils/events";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {

  let email = ""

  // check token and session alive
  try {
    const auth = getAuth(app);

    // no session or invalid session will be redirected to sign in page
    const sessionCookieObj = cookies.get("__session");
    if (!sessionCookieObj) {
      return new Response(
        "No token found", {status: 401}
      )
    }
    const sessionCookie = sessionCookieObj.value;
    const decodedCookie = await auth.verifySessionCookie(sessionCookie);
    if (!decodedCookie) {
      return new Response (
        "Invalid token", { status: 401 }
      )
    }

    email = decodedCookie.email || ""
  }
  catch (err) {
    console.error("Something is wrong with verifying cookie", err)
    return new Response("Session expired. Please sign out and sign in again", { status: 500 })
  }

  // update appResult
  try {
    const formData = await request.formData()
    const withdrawText = formData.get("withdraw-text")?.toString() || "" // should be either accept or withdraw

    // invalid action
    if (withdrawText !== email) {
      await logEvent({ type: "withdraw", result: "rejected_bad_confirmation", email, request })
      return new Response("Invalid email", { status: 400 })
    }

    // disallow action when current appStatus is not "accepted" or "waitlist" or there is no form
    const docSnap = await db.collection(FORMS_COLLECTION).doc(email).get()
    if (!docSnap.exists) {
      await logEvent({ type: "withdraw", result: "rejected_no_application", email, request })
      return new Response("Invalid action", {status: 400})
    }
    const currentStatus = docSnap.data()?.appStatus;
    if (currentStatus !== "accepted" && currentStatus !== "waitlist") {
      await logEvent({ type: "withdraw", result: "rejected_status", email, detail: { appStatus: currentStatus }, request })
      return new Response("Invalid action: user not accepted or waitlisted", {status: 400})
    }

    // action
    const res = await db.collection(FORMS_COLLECTION).doc(email).update({
      appStatus: "declined"
    })
    await logEvent({ type: "withdraw", result: "success", email, detail: { from: currentStatus }, request })

    console.log(`${email}: Successfully withdraw the hackathon`)
    return new Response(`Successfully withdraw the hackathon`)
  }
  catch (err) {
    console.error(err)
    await logEvent({ type: "withdraw", result: "error", email, request })
    return new Response("Something is wrong with server", { status: 500 })
  }
}
