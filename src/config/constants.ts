// Collection name for form submissions - change this for each year
export const FORMS_COLLECTION = "Form_26"

// For Admin Board
export const YEAR_TO_DB = {
    "2026": "Form_26",
    "2025": "Forms"
}

// VVV - DEV OPTIONS - SHOULD BE FALSE IN PROD - VVV

// To allow non UIC emails for testing
export const NON_UIC_BYPASS = false

// Always show decisions regardless of revealDecision setting in Firebase
export const DEV_ALWAYS_REVEAL_DECISION = false