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
        question: "Which day(s) are you available to attent the hackathon? Priority will be given to those who can attend both days.",
        answer: [
            "Both Days",
            "Only Friday February 7th @ 6pm-9pm",
            "Only Saturday February 8th @ 9am-9pm"
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
    teamPlan: {
        question: "Do you have a team? If you do not already, no worries, we have you covered! Note: team size is restricted to 4-5 people.",
        answer: [
            "I have a team",
            "I do not have a team just yet",
        ]
    },
    preWorkshops: { // checkbox
        question: "Which of the following Pre-Hack Workshops would you find useful/interesting to attend PRIOR to SparkHacks? These will be held from February 4th-6th, 2025. For more information on these workshops, view https://www.sparkhacks.org/.",
        answer: [
            "Tuesday: Git Like a Pro",
            "Wednesday: Overthinking? Just React!",
            "Thursday: Tango with Django",
        ]
    },
    jobType: { // required, other
        question: "If you’d like to be considered for an opportunity with our company partners, select the type of job you are looking for:",
        answer: [
            "Summer 2025 Internship",
            "Fall 2025 Internship",
            "Data Analysis New Grad Job",
            "Data Science New Grad Job",
            "Software Engineer New Grad Job",
            "I am currently not looking for a job",
            "Other"
        ],
        other: "otherJobType"
        
    },
    resumeLink: { // not required
        question: "If you would like to be considered for an opportunity with our company sponsors, add in a shareable link to your resume here. If your resume is on Google Docs, make sure you see \"Anyone with the link\" after clicking the \"Share\" button in the top right corner."
    },
}
