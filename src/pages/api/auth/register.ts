import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth"
import { app } from "../../../firebase/server";
import { getFirestore } from "firebase-admin/firestore";

export const POST: APIRoute = async ({request, cookies, redirect}) => {
    const auth = getAuth(app)
    const body = request.body
    const db = getFirestore(app)
    // check if token exists
    const cookieObj = cookies.get("__session")
    if (!cookieObj) {
        return new Response (
            "No token found", { status: 401 }
        )
    }
    const sessionCookie = cookieObj.value
    
    try {

        // check token and get user's id
        const decodedCookie = await auth.verifySessionCookie(sessionCookie)
        if (!decodedCookie) {
            return new Response (
                "Invalid cookie session", { status: 401 }
            )
        }

        // process form data
        const formData = await request.formData()
        const firstName = formData.get("firstName")
        const lastName = formData.get("lastName")
        if (!firstName || !lastName || firstName === "" || lastName === "") {
            return new Response("Bad Request", {status: 400})
        }

        // check if account is already registered
        const docSnap = await db.collection("Accounts").doc(decodedCookie.email as string).get()
        if (!docSnap.exists) {
            console.log("new user!", decodedCookie.email)
            // put to firestore
            await db.collection("Accounts").doc(decodedCookie.email as string).set({
                firstName: firstName,
                lastName: lastName,
            })
        }
        // successful register leads to redirecting to dashboard page
        return new Response("/dashboard")
    }
    catch (err) {
        console.log(err)
        return new Response (
            "Something is wrong with server", { status: 500 } // TODO: is it correct to have error 403
        )
    }
}