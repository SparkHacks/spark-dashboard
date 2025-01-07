import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { app, db } from "../../../firebase/server";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  
  // check admin permission: TODO
  
  try {
    // extract email and update action
    const formData = await request.formData()
    const email = formData.get("email")?.toString() || ""
    const updateAction = formData.get("updateAction")?.toString() || ""

    if (email === "") {
      return new Response ("Empty email", { status: 400 })
    }

    if (updateAction !== "declined" && updateAction !== "accepted" && updateAction !== "waitlist" && updateAction !== "waiting") {
      return new Response ("Update action is not valid", { status: 400 })
    }

    // try to update
    const res = await db.collection("Forms").doc(email).update({
      appResult: updateAction
    })
    console.log(res)
    return new Response("Successful update")
  }
  catch (err) {
    console.error(err)
    return new Response("Something is wrong with server", { status: 500 })
  }
}