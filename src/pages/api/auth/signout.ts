import type { APIRoute } from "astro"
import { getAuth } from "firebase-admin/auth"
import { app } from "../../../firebase/server"
import { logEvent } from "../../../utils/events"

export const GET: APIRoute = async ({request, cookies}) =>  {
    const sessionCookie = cookies.get("__session")?.value
    if (sessionCookie) {
        const decodedCookie = await getAuth(app).verifySessionCookie(sessionCookie).catch(() => null)
        if (decodedCookie?.email) {
            await logEvent({ type: "sign_out", result: "success", email: decodedCookie.email, request })
        }
    }

    cookies.delete("__session", {
        path: "/",
    })
    return new Response("/")
}
