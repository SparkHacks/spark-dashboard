import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth"
import { app } from "../../../firebase/server";

export const GET: APIRoute = async ({request, cookies}) => {
    const auth = getAuth(app)
    const idToken = request.headers.get("Authorization")?.split("Bearer ")[1]
    // check if token exists
    if (!idToken) {
        return new Response(
            "No token found", {status: 401}
        )
    }

    // check if token is valid
    try {
        const decodedIdToken = await auth.verifyIdToken(idToken)
        const email = decodedIdToken.email || ""
        const emailReg = /^[a-zA-Z0-9._%+-]+@uic\.edu$/
        if (!emailReg.test(email)) {
            return new Response (
                "Please sign in with UIC email", {status: 401}
            )
        }
    } catch (err) {
        return new Response (
            "Invalid token", {status: 401}
        )
    }

    // create and set session cookie
    const timeLimit = 30 * 60 * 1000 // 30 minutes in milliseconds
    const sessionCookie = await auth.createSessionCookie(idToken, {expiresIn: timeLimit})
    cookies.set("__session", sessionCookie, {
        path: "/",
        sameSite: "strict"
    })

    return new Response("/dashboard")
}   