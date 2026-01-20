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
  crewneckSize: string | undefined,
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
  console.log("Crewneck size*:", crewneckSize)
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
  crewneckSize: string | undefined,
  teamPlan: string | undefined,
  preWorkshops: string[],
  jobType: string | undefined,
  otherJobType: string | undefined,
  pastSparkHacks: string | undefined,
  pastProjects: string | undefined,
  participationType: string | undefined,
  hearAbout: string[],
  otherHearAbout: string | undefined,
  projectInterest: string[],
  mainGoals: string[],
  skillGit: string | undefined,
  skillFigma: string | undefined,
  skillReact: string | undefined,
  skillPython: string | undefined,
  skillDatabase: string | undefined,
  skillCICD: string | undefined,
  skillAPIs: string | undefined,
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

  // Crewneck Size validation
  if (!crewneckSize || crewneckSize === "") {
    return { success: false, msg: "Empty crewneck size"}
  }
  if (!(questions.crewneckSize.answer.includes(crewneckSize))) {
    return { success: false, msg: "Invalid crewneck size"}
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

  // Past SparkHacks validation
  if (!pastSparkHacks || pastSparkHacks === "") {
    return { success: false, msg: "Empty past SparkHacks participation"}
  }
  if (!(questions.pastSparkHacks.answer.includes(pastSparkHacks))) {
    return { success: false, msg: "Invalid past SparkHacks participation"}
  }

  // Past Hackathons (optional)

  // Past Projects validation
  if (!pastProjects || pastProjects === "") {
    return { success: false, msg: "Empty past projects"}
  }
  if (!(questions.pastProjects.answer.includes(pastProjects))) {
    return { success: false, msg: "Invalid past projects"}
  }

  // Participation Type validation
  if (!participationType || participationType === "") {
    return { success: false, msg: "Empty participation type"}
  }
  if (!(questions.participationType.answer.includes(participationType))) {
    return { success: false, msg: "Invalid participation type"}
  }

  // Hear About validation
  if (hearAbout.length === 0) {
    return { success: false, msg: "Empty hear about"}
  }
  for (const hear of hearAbout) {
    if (!(questions.hearAbout.answer.includes(hear))) {
      return { success: false, msg: "Invalid hear about"}
    }
  }
  if (hearAbout.includes("Other")) {
    if (!otherHearAbout || otherHearAbout === "") {
      return { success: false, msg: "Other hear about is chosen but input is blank"}
    }
  }

  // Why Interested (optional)
  // Team Role (optional)

  // Project Interest validation
  if (projectInterest.length === 0) {
    return { success: false, msg: "Empty project interest"}
  }
  for (const project of projectInterest) {
    if (!(questions.projectInterest.answer.includes(project))) {
      return { success: false, msg: "Invalid project interest"}
    }
  }

  // Main Goals validation
  if (mainGoals.length === 0) {
    return { success: false, msg: "Empty main goals"}
  }
  for (const goal of mainGoals) {
    if (!(questions.mainGoals.answer.includes(goal))) {
      return { success: false, msg: "Invalid main goals"}
    }
  }

  // Skills validation
  if (!skillGit || skillGit === "") {
    return { success: false, msg: "Empty git skill level"}
  }
  if (!(questions.skillGit.answer.includes(skillGit))) {
    return { success: false, msg: "Invalid git skill level"}
  }

  if (!skillFigma || skillFigma === "") {
    return { success: false, msg: "Empty figma skill level"}
  }
  if (!(questions.skillFigma.answer.includes(skillFigma))) {
    return { success: false, msg: "Invalid figma skill level"}
  }

  if (!skillReact || skillReact === "") {
    return { success: false, msg: "Empty React skill level"}
  }
  if (!(questions.skillReact.answer.includes(skillReact))) {
    return { success: false, msg: "Invalid React skill level"}
  }

  if (!skillPython || skillPython === "") {
    return { success: false, msg: "Empty Python skill level"}
  }
  if (!(questions.skillPython.answer.includes(skillPython))) {
    return { success: false, msg: "Invalid Python skill level"}
  }

  if (!skillDatabase || skillDatabase === "") {
    return { success: false, msg: "Empty database skill level"}
  }
  if (!(questions.skillDatabase.answer.includes(skillDatabase))) {
    return { success: false, msg: "Invalid database skill level"}
  }

  if (!skillCICD || skillCICD === "") {
    return { success: false, msg: "Empty CI/CD skill level"}
  }
  if (!(questions.skillCICD.answer.includes(skillCICD))) {
    return { success: false, msg: "Invalid CI/CD skill level"}
  }

  if (!skillAPIs || skillAPIs === "") {
    return { success: false, msg: "Empty APIs skill level"}
  }
  if (!(questions.skillAPIs.answer.includes(skillAPIs))) {
    return { success: false, msg: "Invalid APIs skill level"}
  }

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
