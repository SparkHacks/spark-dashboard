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