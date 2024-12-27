import { google } from "googleapis"

const sheetKey = {
    "type": import.meta.env.SERVER_TYPE,
    "project_id": import.meta.env.SERVER_PROJECT_ID,
    "private_key_id": import.meta.env.SERVER_PRIVATE_KEY_ID,
    "private_key": import.meta.env.SERVER_PRIVATE_KEY,
    "client_email": import.meta.env.SERVER_CLIENT_EMAIL,
    "client_id": import.meta.env.SERVER_CLIENT_ID,
    "auth_uri": import.meta.env.SERVER_AUTH_URI,
    "token_uri": import.meta.env.SERVER_TOKEN_URI,
    "auth_provider_x509_cert_url": import.meta.env.SERVER_AUTH_PROVIDER_X509_CERT_URL,
    "client_x509_cert_url": import.meta.env.SERVER_CLIENT_X509_CERT_URL,
    "universe_domain": import.meta.env.SERVER_UNIVERSE_DOMAIN
}

// console.log(sheetKey)
export const SHEET_ID = "1denB7kD96HeDffOjWiSucg_CPyK9XGCBPWMFL2AJgxE"

const client = new google.auth.JWT(sheetKey.client_email, undefined, sheetKey.private_key, [
    "https://www.googleapis.com/auth/spreadsheets"
])
const sheets = google.sheets({
    version: "v4",
    auth: client
})
export default sheets
