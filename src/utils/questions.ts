export const questions = {
    firstName: {
        question: "First Name",
    },
    lastName: {
        question: "Last Name",
    },
    uin: {
        question: "UIN",
    },
    gender: {
        question: "Gender",
        answer: [
            "Male",
            "Female",
            "Non-binary"
        ]
    },
    year: {
        question: "Year",
        answer: [
            "Freshman",
            "Sophomore",
            "Junior",
            "Senior",
            "Masters",
            "PhD",
        ]
    },
    availability: {
        question: "Which day(s) are you available to attend the hackathon? Priority will be given to those who can attend both days.",
        answer: [
            "Both days full duration",
            "Both days not full duration",
            "Day one only",
            "Day two only"
        ],
    },
    moreAvailability: { // not required
        question: "If you want to add more detailed availability, please add it here!"
    },
    dietaryRestriction: { // checkbox, other
        question: "Do you have any dietary restrictions?",
        answer: [
            "Vegetarian",
            "Halal",
            "Vegan",
            "Gluten Free",
            "Nut Allergy",
            "N/A",
            "Other"
        ],
        other: "otherDietaryRestriction"
    },
    crewneckSize: {
        question: "What is your unisex crewneck size?",
        answer: [
            "S",
            "M",
            "L",
            "XL",
            "XXL"
        ]
    },
    teamPlan: {
        question: "Do you have a team? If you do not already, no worries, we have you covered! Note: team size is restricted to 4-5 people.",
        answer: [
            "I have a team",
            "I do not have a team just yet",
        ]
    },
    preWorkshops: { // checkbox
        question: "Which of the following Pre-Hack Workshops would you find useful/interesting to attend PRIOR to SparkHacks? For more information on these workshops, view https://www.sparkhacks.org/.",
        answer: [
            "🛠️ Git Like a Pro | Monday - February 2th @ 4:30pm",
            "⚛️ Overthinking? Just React! | Tuesday - February 3th @ 4:30pm",
            "🍃 Intro to MongoDB | Wednesday - February 4th @ 4:30pm",
        ]
    },
    jobType: { // required, other
        question: "If you'd like to be considered for an opportunity with our company partners, select the type of job you are looking for:",
        answer: [
            "Summer internship",
            "Full-time",
            "During-school part-time intern",
            "I am currently not looking for a job",
            "Other"
        ],
        other: "otherJobType"

    },
    resumeLink: { // not required
        question: "If you would like to be considered for an opportunity with our company sponsors, add in a shareable link to your resume here. If your resume is on Google Docs, make sure you see \"Anyone with the link\" after clicking the \"Share\" button in the top right corner."
    },
    linkedinUrl: { // not required
        question: "LinkedIn URL (Optional)"
    },

    // Logistics & Background
    pastSparkHacks: {
        question: "Did you participate in SparkHacks in the past?",
        answer: ["Yes", "No"]
    },
    pastHackathons: { // not required
        question: "Have you participated in any other hackathons in the past? If yes, please name them."
    },
    pastProjects: {
        question: "Have you completed any personal projects by yourself or with a team in the past?",
        answer: [
            "Yes",
            "No",
            "Started but didn't finish"
        ]
    },
    participationType: {
        question: "How are you planning on participating?",
        answer: [
            "Code",
            "No code",
            "Here to get involved"
        ]
    },
    hearAbout: { // checkbox, other
        question: "How did you hear about SparkHacks? (Select all that apply)",
        answer: [
            "Flyers",
            "Instagram",
            "Discord",
            "Piazza",
            "In class announcements",
            "Friend/word of mouth",
            "Other"
        ],
        other: "otherHearAbout"
    },

    // Interest & Goals
    whyInterested: { // not required
        question: "Why are you interested in participating in SparkHacks 2026? (50 words or less)"
    },
    teamRole: { // not required
        question: "What will you bring to your team? Which role will you serve on your team (designer, backend, frontend, project manager, etc.)? (50 words or less)"
    },
    projectInterest: { // checkbox
        question: "What type of project are you interested in working on? (Select all that apply)",
        answer: [
            "Social impact",
            "Business tool",
            "Game"
        ]
    },
    mainGoals: { // checkbox
        question: "What is the main goal you want to accomplish during SparkHacks? (Select all that apply)",
        answer: [
            "Network with company representatives",
            "Build my first project",
            "Build a new project for my resume",
            "Try to win a prize!"
        ]
    },

    // Skills (1-5 scale for each)
    skillGit: {
        question: "Experience with git/github (1 = novice, 5 = proficient)",
        answer: ["1", "2", "3", "4", "5"]
    },
    skillFigma: {
        question: "Experience with figma (1 = novice, 5 = proficient)",
        answer: ["1", "2", "3", "4", "5"]
    },
    skillReact: {
        question: "Experience with React (or other frontend framework) (1 = novice, 5 = proficient)",
        answer: ["1", "2", "3", "4", "5"]
    },
    skillPython: {
        question: "Experience with Python (1 = novice, 5 = proficient)",
        answer: ["1", "2", "3", "4", "5"]
    },
    skillDatabase: {
        question: "Experience with databases/SQL (1 = novice, 5 = proficient)",
        answer: ["1", "2", "3", "4", "5"]
    },
    skillCICD: {
        question: "Experience with CI/CD (1 = novice, 5 = proficient)",
        answer: ["1", "2", "3", "4", "5"]
    },
    skillAPIs: {
        question: "Experience with APIs (1 = novice, 5 = proficient)",
        answer: ["1", "2", "3", "4", "5"]
    },
}
