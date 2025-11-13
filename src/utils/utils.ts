import { db } from "../firebase/server"
import { questions } from "./questions"
import type { FormSubmissionData } from "../env"
import { FORMS_COLLECTION } from "../config/constants"
export { FORMS_COLLECTION }

export const displayFormData = (
  email: string | undefined,
  firstName: string  | undefined,
  lastName: string | undefined,
  uin: string | undefined,
  gender: string | undefined,
  year: string | undefined,
  availability: string | undefined,
  moreAvailability: string | undefined,
  dietaryRestriction: string[] | undefined,
  otherDietaryRestriction: string | undefined,
  shirtSize: string | undefined,
  teamPlan: string | undefined,
  preWorkshops: string[],
  jobType: string | undefined,
  otherJobType: string | undefined,
  resumeLink: string | undefined,
) => {
  console.log("Email*:", email)
  console.log("First Name*:", firstName)
  console.log("Last name*:", lastName)
  console.log("UIN*:", uin)
  console.log("Gender*:", gender)
  console.log("Year*:", year)
  console.log("Availability*:", availability)
  console.log("More availability:", moreAvailability)
  console.log("Dietary Restriction*:", dietaryRestriction)
  console.log("Other Dietary Restriction:", otherDietaryRestriction)
  console.log("Shirt size*:", shirtSize)
  console.log("Team Plan*:", teamPlan)
  console.log("Pre workshops*:", preWorkshops)
  console.log("Job type:*", jobType)
  console.log("Other Job Type:", otherJobType)
  console.log("Resume Link:", resumeLink)
}

// process form data
export const validateFormData = (
  firstName: string | undefined,
  lastName: string | undefined,
  uin: string | undefined,
  gender: string | undefined,
  year: string | undefined,
  availability: string | undefined,
  dietaryRestriction: string[],
  otherDietaryRestriction: string | undefined,
  shirtSize: string | undefined,
  teamPlan: string | undefined,
  preWorkshops: string[],
  jobType: string | undefined,
  otherJobType: string | undefined,
) => {

  // First Name validation
  if (!firstName || firstName === "") {
    return { success: false, msg: "Empty first name" }
  }

  // Last Name validation
  if (!lastName || lastName === "") {
    return { success: false, msg: "Empty last name" }
  }

  // UIN validation
  if (!uin || uin === "") {
    return { success: false, msg: "Empty UIN" }
  }
  let regexUin = /^\d{9}$/
  if (!regexUin.test(uin)) {  // reject uin has non-numeric characters
    return { success: false, msg: "UIN does not contains 9 digits" }
  }

  // Gender validation
  if (!gender || gender === "") {
    return { success: false, msg: "Empty gender"}
  }
  if (!(questions.gender.answer.includes(gender))) {
    return { success: false, msg: "Invalid gender" }
  }

  // Year validation
  if (!year || year === "") {
    return { success: false, msg: "Empty year"}
  }
  if (!(questions.year.answer.includes(year))) {
    return { success: false, msg: "Invalid year" }
  }

  // Hackathon Availability validation
  if (!availability || availability === "") {
    return { success: false, msg: "Empty hackathon availability"}
  }
  if (!(questions.availability.answer.includes(availability))) {
    return { success: false, msg: "Invalid hackathon availability"}
  }

  // Other: Hackathon availability (optional)

  // Dietary Restriction validation
  if (dietaryRestriction.length === 0) {
    return { success: false, msg: "Empty dietary restriction"}
  }
  for (const diet of dietaryRestriction) {
    if (!(questions.dietaryRestriction.answer.includes(diet))) {
      return { success: false, msg: "Invalid dietary restriction"}
    }
  }
  if (dietaryRestriction.includes("Other")) {
    if (!otherDietaryRestriction || otherDietaryRestriction === "") {
      return { success: false, msg: "Other dietary restriction is chosen but input is blank"}
    }
  }

  // T-shirt Size validation
  if (!shirtSize || shirtSize === "") {
    return { success: false, msg: "Empty t-shirt size"}
  }
  if (!(questions.shirtSize.answer.includes(shirtSize))) {
    return { success: false, msg: "Invalid t-shirt size"}
  }

  // Have Team validation
  if (!teamPlan || teamPlan === "") {
    return { success: false, msg: "Empty input for team" }
  }
  if (!(questions.teamPlan.answer.includes(teamPlan))) {
    return { success: false, msg: "Invalid input for team"}
  }

  // Pre-Workshop validation
  if (preWorkshops.length === 0) {
    return { success: false, msg: "Empty pre-workshops"}
  }
  for (const preW of preWorkshops) {
    if (!(questions.preWorkshops.answer.includes(preW))) {
      return { success: false, msg: "Invalid pre-workshops"}
    }
  }

  // job type
  if (!jobType || jobType === "") {
    return { success: false, msg: "Empty job type"}
  }
  if (!questions.jobType.answer.includes(jobType)) {
    return { success: false, msg: "Invalid job type"}
  }
  if (jobType === "Other") {
    if (!otherJobType || otherJobType == "") {
      return { success: false, msg: "Job type is other but empty input"}
    }
  }

  // resume link (optional)

  return { success: true, msg: "Valid form data" }
}

/*
// send form to google sheet: THIS FUNCTION IS INCOMPLETE
export const sendFormToGoogleSheet = async (formSubmissionData: FormSubmissionData) => {
  const { email, firstName, lastName, uin, gender, year, availability, moreAvailability, dietaryRestriction, shirtSize, hackathonPlan, preWorkshops, workshops, jobType, resumeLink, otherQuestion, appStatus } = formSubmissionData
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "DATABASE!A2:Q2",
    insertDataOption: "INSERT_ROWS",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        email,
        firstName,
        lastName,
        uin,
        gender,
        year,
        availability,
        moreAvailability,
        dietaryRestriction,
        shirtSize,
        hackathonPlan,
        preWorkshops,
        workshops,
        jobType,
        resumeLink,
        otherQuestion,
        appStatus
      ]]
    }
  })
}*/

// send form to firestore
export const sendFormToFirestore = async (formSubmissionData: FormSubmissionData) => {
  await db.collection(FORMS_COLLECTION).doc(formSubmissionData.email).set(formSubmissionData)
}
