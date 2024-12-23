import type { APIRoute } from "astro";
import sheets, { SHEET_ID} from "../../../googlesheet/client.ts";
import { getAuth } from "firebase-admin/auth"
import { app } from "../../../firebase/server";

export const POST: APIRoute = async ({request, cookies, redirect}) => {


    const auth = getAuth(app)

    // check if session cookie exists
    if (!cookies.has("__session")) {
        return new Response (
            "no token found", { status: 401 }
        )
    }

    // check if session cookie is still valid
    const sessionCookie = cookies.get("__session").value
    try {
        const decodedCookie = await auth.verifySessionCookie(sessionCookie)
        if (!decodedCookie) {
            return new Response (
                "no token found", { status: 401 }
            )
        }
    }
    catch (err) {
        console.log("Something is wrong with verifying cookie", err)
        return new Response("Something is wrong with server", {status: 500})
    }

    // process form data
    const formData = await request.formData()
    const email = formData.get("email")?.toString()
    const firstName = formData.get("firstName")?.toString()
    const lastName = formData.get("lastName")?.toString()
    const uin = formData.get("uin")?.toString()
    const gender = formData.get("gender")?.toString()
    const row = [email, firstName, lastName, uin, gender]

    // validate the input
    if (!email || !firstName || !lastName || !uin || !gender || email === "" || firstName === "" || lastName === "" || uin === "" || gender === "") {
        return new Response(`Incorrect form data: ${email}`, {status: 400})
    }

    try {
        // warning: googlesheet api free version allows max 60 write request per min (according to doc), but according to my testing, it allows only 40
        console.log("adding to google sheet:", email)
        // send data
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: "DATABASE!A2:E2",
            insertDataOption: "INSERT_ROWS",
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [row]
            }
        })
    
        // wait for success, if not success then decline
        return new Response(`Successful: ${email}`)
    }
    catch (err) {
        console.log(err)
        return new Response(`Something is wrong: ${email}`, {status: 500})
    }
}