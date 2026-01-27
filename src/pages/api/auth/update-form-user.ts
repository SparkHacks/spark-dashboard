import type { APIRoute } from "astro";
import { validateFormData, FORMS_COLLECTION } from "../../../utils/utils.ts";
import { getAuth } from "firebase-admin/auth";
import { app, db } from "../../../firebase/server.ts";

export const POST: APIRoute = async ({ request, cookies }) => {

  // Check if editing is enabled
  const canEdit = (await db.collection("Settings").doc("canEdit").get()).data()?.canEdit
  if (!canEdit) {
    return new Response(`Editing is currently disabled`, { status: 403 });
  }

  const auth = getAuth(app)

  // check if session cookie exists
  const sessionCookieObj = cookies.get("__session")
  if (!sessionCookieObj) {
    return new Response("No token found", { status: 401 })
  }

  // check if session cookie is still valid
  const sessionCookie = sessionCookieObj.value
  let email = ""
  try {
    const decodedCookie = await auth.verifySessionCookie(sessionCookie)
    if (!decodedCookie) {
      return new Response("Invalid token", { status: 401 })
    }
    email = decodedCookie.email as string
  }
  catch (err) {
    console.log("Something is wrong with verifying cookie", err)
    return new Response("Session expired. Please sign out and sign in again", { status: 500 })
  }

  // Check if user has an existing application to update
  try {
    const docSnap = await db.collection(FORMS_COLLECTION).doc(email).get()
    if (!docSnap.exists) {
      return new Response("No application found to update", { status: 404 })
    }
  }
  catch (err) {
    console.error(`Something is wrong with checking form for ${email}`, err)
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
  const crewneckSize = formData.get("crewneckSize")?.toString()
  const teamPlan = formData.get("teamPlan")?.toString()
  const preWorkshops = formData.getAll("preWorkshops").map(item => item.toString())
  const jobType = formData.get("jobType")?.toString()
  const otherJobType = formData.get("otherJobType")?.toString()
  const resumeLink = formData.get("resumeLink")?.toString()
  const linkedinUrl = formData.get("linkedinUrl")?.toString()

  // Logistics & Background
  const pastSparkHacks = formData.get("pastSparkHacks")?.toString()
  const pastHackathons = formData.get("pastHackathons")?.toString()
  const pastProjects = formData.get("pastProjects")?.toString()
  const participationType = formData.get("participationType")?.toString()
  const hearAbout = formData.getAll("hearAbout").map(item => item.toString())
  const otherHearAbout = formData.get("otherHearAbout")?.toString()

  // Interest & Goals
  const whyInterested = formData.get("whyInterested")?.toString()
  const teamRole = formData.get("teamRole")?.toString()
  const projectInterest = formData.getAll("projectInterest").map(item => item.toString())
  const mainGoals = formData.getAll("mainGoals").map(item => item.toString())

  // Skills
  const skillGit = formData.get("skillGit")?.toString()
  const skillFigma = formData.get("skillFigma")?.toString()
  const skillReact = formData.get("skillReact")?.toString()
  const skillPython = formData.get("skillPython")?.toString()
  const skillDatabase = formData.get("skillDatabase")?.toString()
  const skillCICD = formData.get("skillCICD")?.toString()
  const skillAPIs = formData.get("skillAPIs")?.toString()

  // validate the input
  const validateFormResult = validateFormData(firstName, lastName, uin, gender, year, availability, dietaryRestriction, otherDietaryRestriction, crewneckSize, teamPlan, preWorkshops, jobType, otherJobType, pastSparkHacks, pastProjects, participationType, hearAbout, otherHearAbout, projectInterest, mainGoals, skillGit, skillFigma, skillReact, skillPython, skillDatabase, skillCICD, skillAPIs)
  if (!validateFormResult.success) {
    return new Response(`Incorrect form data: ${validateFormResult.msg}`, { status: 400 })
  }

  try {
    const updateData = {
      firstName,
      lastName,
      uin: parseInt(uin as string),
      gender,
      year,
      availability,
      moreAvailability: moreAvailability || "",
      dietaryRestriction,
      otherDietaryRestriction: (dietaryRestriction.includes("Other")) ? otherDietaryRestriction : "",
      crewneckSize,
      teamPlan,
      preWorkshops,
      jobType: jobType || "",
      otherJobType: (jobType === "Other") ? otherJobType : "",
      resumeLink: resumeLink || "",
      linkedinUrl: linkedinUrl || "",

      // Logistics & Background
      pastSparkHacks,
      pastHackathons: pastHackathons || "",
      pastProjects,
      participationType,
      hearAbout,
      otherHearAbout: (hearAbout.includes("Other")) ? otherHearAbout : "",

      // Interest & Goals
      whyInterested: whyInterested || "",
      teamRole: teamRole || "",
      projectInterest,
      mainGoals,

      // Skills
      skillGit,
      skillFigma,
      skillReact,
      skillPython,
      skillDatabase,
      skillCICD,
      skillAPIs,
    }

    console.log("Updating form for:", email)

    // Update form data in database
    await db.collection(FORMS_COLLECTION).doc(email).update(updateData)

    return new Response(`Successfully updated: ${email}`)
  }
  catch (err) {
    console.log(`Something is wrong with updating form for ${email}`, err)
    return new Response(`Something is wrong with updating form for ${email}`, { status: 500 })
  }
}
