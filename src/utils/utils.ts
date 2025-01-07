import sheets, { SHEET_ID } from "../googlesheet/client"
import { db } from "../firebase/server"
import { questions } from "./questions"
import type { FormSubmissionData, FormViewData } from "../env"

export const displayFormData = (
  email: string | undefined,
  firstName: string  | undefined,
  lastName: string | undefined,
  uin: string | undefined,
  gender: string | undefined,
  year: string | undefined,
  availability: string | undefined,
  moreAvailability: string | undefined,
  dietaryRestriction: string | undefined,
  shirtSize: string | undefined,
  hackathonPlan: string | undefined,
  preWorkshops: string[],
  workshops: string[],
  jobType: string | undefined,
  resumeLink: string | undefined,
  otherQuestion: string | undefined,
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
  console.log("Shirt size*:", shirtSize)
  console.log("Hackathon plan*:", hackathonPlan)
  console.log("Pre workshops*:", preWorkshops)
  console.log("Workshops*:", workshops)
  console.log("Job type:", jobType)
  console.log("Resume Link:", resumeLink)
  console.log("Other question:", otherQuestion)
}

// process form data
export const validateFormData = (
  firstName: string | undefined,
  lastName: string | undefined,
  uin: string | undefined,
  gender: string | undefined,
  year: string | undefined,
  availability: string | undefined,
  dietaryRestriction: string | undefined,
  shirtSize: string | undefined,
  hackathonPlan: string | undefined,
  preWorkshops: string[],
  workshops: string[],
  jobType: string | undefined
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
  if (!dietaryRestriction || dietaryRestriction === "") {
    return { success: false, msg: "Empty dietary restriction"}
  }
  if (!(questions.dietaryRestriction.answer.includes(dietaryRestriction))) {
    return { success: false, msg: "Invalid dietary restriction"}
  }

  // T-shirt Size validation
  if (!shirtSize || shirtSize === "") {
    return { success: false, msg: "Empty t-shirt size"}
  }
  if (!(questions.shirtSize.answer.includes(shirtSize))) {
    return { success: false, msg: "Invalid t-shirt size"}
  }

  // Hackathon Plan validation
  if (!hackathonPlan || hackathonPlan === "") {
    return { success: false, msg: "Empty hackathon plan" }
  }
  if (!(questions.hackathonPlan.answer.includes(hackathonPlan))) {
    return { success: false, msg: "Invalid hackathon plan"}
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

  // Workshop validation
  if (workshops.length === 0) {
    return { success: false, msg: "Empty workshops"}
  }
  for (const workS of workshops) {
    if (!(questions.workshops.answer.includes(workS))) {
      return { success: false, msg: "Invalid workshops"}
    }
  }

  // Company (optional)
  if (jobType) {
    if (jobType !== "" && !questions.jobType.answer.includes(jobType)) {
      return { success: false, msg: "Invalid job type"}
    }
  }

  // resume link (optional)

  // Other note

  return { success: true, msg: "Valid form data" }
}

// send form to google sheet
export const sendFormToGoogleSheet = async (formSubmissionData: FormSubmissionData) => {
  const { email, firstName, lastName, uin, gender, year, availability, moreAvailability, dietaryRestriction, shirtSize, hackathonPlan, preWorkshops, workshops, jobType, resumeLink, otherQuestion, appResult } = formSubmissionData
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
        appResult
      ]]
    }
  })
}

// send form to firestore
export const sendFormToFirestore = async (formSubmissionData: FormSubmissionData) => {
  await db.collection("Forms").doc(formSubmissionData.email).set(formSubmissionData)
}

// get all form data from firestore
export const getAllForms = async () => {
  const snapshot = await db.collection("Forms").orderBy("createdAt").limit(50).get()
  return snapshot.docs.map(doc => {
    const data = doc.data()

    return {
      createdAt: data.createdAt.toDate().toLocaleString(),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      uin: data.uin,
      gender: data.gender,
      year: data.year,
      availability: data.availability,
      moreAvailability: data.moreAvailability,
      dietaryRestriction: data.dietaryRestriction,
      shirtSize: data.shirtSize,
      hackathonPlan: data.hackathonPlan,
      preWorkshops: data.preWorkshops,
      workshops: data.workshops,
      jobType: data.jobType,
      resumeLink: data.resumeLink,
      otherQuestion: data.otherQuestion,
      appResult: data.appResult
    } as FormViewData
  })
}