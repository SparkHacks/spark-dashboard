interface ImportMetaEnv {
    readonly PUBLIC_API_KEY: string;
    readonly PUBLIC_AUTH_DOMAIN: string;
    readonly PUBLIC_PROJECT_ID: string;
    readonly PUBLIC_STORAGE_BUCKET: string;
    readonly PUBLIC_MESSAGING_SENDER_ID: string;
    readonly PUBLIC_APP_ID: string;

    readonly SERVER_TYPE: string;
    readonly SERVER_PROJECT_ID: string
    readonly SERVER_PRIVATE_KEY_ID: string;
    readonly SERVER_PRIVATE_KEY: string;
    readonly SERVER_CLIENT_EMAIL: string;
    readonly SERVER_CLIENT_ID: string;
    readonly SERVER_AUTH_URI: string;
    readonly SERVER_TOKEN_URI: string;
    readonly SERVER_AUTH_PROVIDER_X509_CERT_URL: string;
    readonly SERVER_CLIENT_X509_CERT_URL: string;
    readonly SERVER_UNIVERSE_DOMAIN: string;

}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

interface FormSubmissionData {
    email: string,
    firstName: string,
    lastName: string,
    uin: number,
    gender: string,
    year: string,
    availability: string,
    moreAvailability: string, // optional
    dietaryRestriction: string,
    shirtSize: string,
    hackathonPlan: string,
    preWorkshops: string[],
    workshops: string[],
    jobType: string, // optional
    resumeLink: string, // optional
    otherQuestion: string, // optional
    appResult: "waiting" | "declined" | "waitlist" | "accepted"
}