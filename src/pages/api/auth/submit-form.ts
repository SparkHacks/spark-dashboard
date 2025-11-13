import type { APIRoute } from "astro";
import { displayFormData, sendFormToFirestore, validateFormData, FORMS_COLLECTION } from "../../../utils/utils.ts";
import { FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { app, db } from "../../../firebase/server.ts";
import type { FormSubmissionData } from "../../../env";
import { sendEmailConfirmation } from "../../../nodemailer/nodemailer.ts";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {

  const newUserState = (await db.collection("Settings").doc("newUserState").get()).data()?.isNewUserEnabled

  if (!newUserState)
    return new Response(`Registration closed`, { status: 403 });

  const auth = getAuth(app)

  // check if session cookie exists
  const sessionCookieObj = cookies.get("__session")
  if (!sessionCookieObj) {
    return new Response(
      "No token found", { status: 401 }
    )
  }

  // check if session cookie is still valid
  const sessionCookie = sessionCookieObj.value
  let email = ""
  try {
    const decodedCookie = await auth.verifySessionCookie(sessionCookie)
    if (!decodedCookie) {
      return new Response(
        "Invalid token", { status: 401 }
      )
    }
    email = decodedCookie.email as string
  }
  catch (err) {
    console.log("Something is wrong with verifying cookie", err)
    return new Response("Session expired. Please sign out and sign in again", { status: 500 })
  }

  // check if user already submit it: TODO
  try {
    const docSnap = await db.collection(FORMS_COLLECTION).doc(email).get()
    if (docSnap.exists) {
      console.error(`User ${email} already submit form`)
      return new Response("Form already submitted", {status: 400})
    }
  }
  catch (err) {
    console.error(`Something is wrong with checking form submit for ${email}`, err)
    return new Response(null, { status: 500 })
  }

  // process form data and destructure it
  const formData = await request.formData()
  const firstName = formData.get("firstName")?.toString()
  const lastName = formData.get("lastName")?.toString()
  const uin = formData.get("uin")?.toString()
  const gender = formData.get("gender")?.toString()
  const year = formData.get("year")?.toString()
  const availability = formData.get("availability")?.toString()
  const moreAvailability = formData.get("moreAvailability")?.toString() 
  const dietaryRestriction = formData.getAll("dietaryRestriction").map(item => item.toString())
  const otherDietaryRestriction = formData.get("otherDietaryRestriction")?.toString()
  const shirtSize = formData.get("shirtSize")?.toString()
  const teamPlan = formData.get("teamPlan")?.toString()
  const preWorkshops = formData.getAll("preWorkshops").map(item => item.toString())
  const jobType = formData.get("jobType")?.toString()
  const otherJobType = formData.get("otherJobType")?.toString()
  const resumeLink = formData.get("resumeLink")?.toString()
  displayFormData(email, firstName, lastName, uin, gender, year, availability, moreAvailability, dietaryRestriction, otherDietaryRestriction, shirtSize, teamPlan, preWorkshops, jobType, otherJobType, resumeLink)


  // validate the input
  const validateFormResult = validateFormData(firstName, lastName, uin, gender, year, availability, dietaryRestriction, otherDietaryRestriction, shirtSize, teamPlan, preWorkshops, jobType, otherJobType)
  if (!validateFormResult.success) {
    return new Response(`Incorrect form data: ${validateFormResult.msg}`, { status: 400 })
  }
  
  try {
    const formSubmissionData = {
      email,
      firstName,
      lastName,
      uin: parseInt(uin as string),
      gender,
      year,
      availability,
      moreAvailability: moreAvailability || "",
      dietaryRestriction,
      otherDietaryRestriction: (dietaryRestriction.includes("Other"))? otherDietaryRestriction : "",
      shirtSize,
      teamPlan,
      preWorkshops,
      jobType: jobType || "",
      otherJobType: (jobType === "Other") ? otherJobType : "",
      resumeLink: resumeLink || "",
      appStatus: "waiting",
      createdAt: FieldValue.serverTimestamp()
    } as FormSubmissionData

    console.log("Submmitting form for:", email)

    // submit form data to database
    await sendFormToFirestore(formSubmissionData)

    // send email to user to confirm
    sendEmailConfirmation(email)

    // wait for success, if not success then decline
    return new Response(`Successful: ${email}`)
  }
  catch (err) {
    console.log(`Something is wrong with submitting form for ${email}`, err)
    return new Response(`Something is wrong with submitting form for ${email}`, { status: 500 })
  }
}