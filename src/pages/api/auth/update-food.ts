import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { app, db } from "../../../firebase/server";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  
  // check token and session alive, check admin permission
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

    // check admin permission
    const user = await auth.getUser(decodedCookie.uid)
    if (!(user.customClaims && user.customClaims.admin === true)) {
      console.error("Not admin")
      return new Response("Not accessible", {status: 401})
    }

  }
  catch (err) {
    console.log("Something is wrong with verifying cookie", err)
    return new Response("Session expired. Please sign out and sign in again", { status: 500 })
  }
  
  // update appStatus
  try {
    // extract email and update action
    const formData = await request.json()
    if(formData.email === "") {
      return new Response ("Empty email", { status: 400 })
    }

    // try to update
    const res = await db.collection("Forms").doc(formData.email)
    .update({
      d1Snack: formData.d1Snack,
      d1Dinner: formData.d1Dinner,
      d1Cookies: formData.d1Cookies,
      d2Breakfast: formData.d2Breakfast,
      d2Lunch: formData.d2Lunch,
      d2Dinner: formData.d2Dinner,
    })
    // console.log(res)
    return new Response("Successful update")
  }
  catch (err) {
    console.error(err)
    return new Response("Something is wrong with server", { status: 500 })
  }
}