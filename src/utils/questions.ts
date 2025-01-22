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
            "Non binary",
            "Other"
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
        question: "Which day(s) are you available to attent the hackathon? Priority will be given to those who can attend both days.",
        answer: [
            "Both Days",
            "Only Friday February 7th @ 6pm-9pm",
            "Only Saturday February 8th @ 9am-9pm"
        ],
    },
    moreAvailability: { // not required
        question: "If you want to add more detailed availability please add it here!"
    },
    dietaryRestriction: {
        question: "Do you have any dietary restrictions?",
        answer: [
            "Vegetarian",
            "Halal",
            "Vegan",
            "Gluten Free",
            "Nut Allergy",
            "N/A"
        ]
    },
    shirtSize: {
        question: "What is your unisex t-shirt size?",
        answer: [
            "S",
            "M",
            "L",
            "XL",
            "XXL"
        ]
    },
    hackathonPlan: {
        question: "Do you have a team? If you do not already, no worries, we have you covered! Note: team size is restricted to 4-5 people.",
        answer: [
            "I have a team",
            "I do not have a team yet"
        ]
    },
    preWorkshops: {
        question: "Which of the following Pre-Hack Workshops would you find useful/interesting to attend PRIOR to SparkHacks? These will be held from February 4th-6th, 2025. For more information on these workshops, view https://www.sparkhacks.org/. (Select all that apply)",
        answer: [
            "Tuesday: Git Like a Pro",
            "Wednesday: Overthinking? Just React!",
            "Thursday: Tango with Django",
        ]
    },
    workshops: {
        question: "Which of the following workshop topics would you find useful/interesting to attend DURING  SparkHacks? (Select all that apply)",
        answer: [
            "Ideation Workshop with Discover",
            "Intro to AWS with Discover",
            "Resume Review Workshop with Caterpillar",
            "Interviewing Tips and Tricks with Abbvie",
            "Intro to API Workshop with Caterpillar",
            "Creating a Basic Web App Workshop with John Deere",
        ]
    },
    jobType: { // not required
        question: "If you would like to be considered for an opportunity with our company partners, select the type of job you are looking for:",
        answer: [
            "Summer 2025 Internship",
            "Fall 2025 Internship",
            "Data Analysis New Grab Job",
            "Data Science New Grad Job",
            "Software Engineer New Grad Job",
            "I am currently not looking for a job",
            "Other"
        ]
    },
    resumeLink: { // not required
        question: "If you would like to be considered for an opportunity with our company sponsors, add in a shareable link to your resume here. If your resume is on Google Docs, make sure you see \"Anyone with the link\" after clicking the \"Share\" button in the top right corner."
    },
    otherQuestion: { // not required
        question: "If you have any other questions / comments please drop them here!"
    }
}
