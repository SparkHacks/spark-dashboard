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
    // if (!(user.customClaims && user.customClaims.admin === true)) {
    //   console.error("Not admin")
    //   return new Response("Not accessible", {status: 401})
    // }

  }
  catch (err) {
    console.log("Something is wrong with verifying cookie", err)
    return new Response("Session expired. Please sign out and sign in again", { status: 500 })
  }
  
  // update appStatus
  try {
    // Read the payload from the body of the request
    const formData = await request.json()
    const { isEnabled }: { isEnabled: boolean } = formData;

    // Validate the isEnabled value
    if (typeof isEnabled !== 'boolean') {
        return new Response ("Invalid value for isEnabled. Must be a boolean.", { status: 400 })
    }

    // try to update
    const res = await db.collection("Settings").doc("newUserState").set({
        isNewUserEnabled: isEnabled
    }, {merge: true})

    console.log(`${formData.email}: Successfully updated loginstate`)
    return new Response(JSON.stringify({isNewUserEnabled: isEnabled, success: true}), { status: 200 })
  }
  catch (err) {
    console.error(err)
    return new Response("Something is wrong with server", { status: 500 })
  }
}

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  
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
      // if (!(user.customClaims && user.customClaims.admin === true)) {
      //   console.error("Not admin")
      //   return new Response("Not accessible", {status: 401})
      // }
  
    }
    catch (err) {
      console.log("Something is wrong with verifying cookie", err)
      return new Response("Session expired. Please sign out and sign in again", { status: 500 })
    }
    
    // update appStatus
    try {
      // Read the payload from the body of the request
  
  
      // get status

    const newUserState = await db.collection("Settings").doc("newUserState").get()
    if (!newUserState.exists) {
    return new Response("Invalid action", {status: 400})
    }

    return new Response(JSON.stringify(newUserState.data()), {status: 200})

    }
    catch (err) {
      console.error(err)
      return new Response("Something is wrong with server", { status: 500 })
    }
  }