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
            "Non binary"
        ]
    },
    year: {
        question: "Year",
        answer: [
            "Freshman",
            "Sophomore",
            "Junior",
            "Senior",
            "Graduate"
        ]
    },
    availability: {
        question: "Which day(s) are you available to attent the hackathon? Priority will be given to those who can attend both days. (Merch will be given day 2)",
        answer: [
            "Both Days",
            "Only Friday February 7th @ 2:30pm - 9pm",
            "Only Saturday February 8th @ 9am - 8pm"
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
            "XS",
            "S",
            "M",
            "L",
            "XL"
        ]
    },
    hackathonPlan: {
        question: "How do you plan to participate at SparkHacks? Everyone will be able to attend company sessions and/or workshops. Note: Maximum team size is 5",
        answer: [
            "I will be hacking and I have a team",
            "I will be hacking, but I do not have a team yet",
            "I just want to attend the workshops"
        ]
    },
    preWorkshops: {
        question: "Which of the following Workshop topics would you find useful/interesting to attend PRIOR to SparkHacks? These will be held from 5th - 8th Feb 2024 from 5 - 6:30pm (Select all that apply)",
        answer: [
            "Monday: Intro to Git - Git yourself Together",
            "Tuesday: Intro to Web Dev (React & Tailwind CSS)",
            "Wednesday: Intro to Google Firebase",
            "Thursday: Team Building Social",
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
        question: "If you’d like to be considered for an opportunity with our company partners, select the type of job you are looking for:",
    },
    resumeLink: { // not required
        question: "If you’d like to be considered for an opportunity with our company partners, submit a PDF of your resume here."
    },
    otherQuestion: { // not required
        question: "If you have any other questions / comments please drop them here!"
    }
}
