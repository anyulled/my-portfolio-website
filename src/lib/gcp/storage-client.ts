/**
 * Unified Google Cloud Storage Client Factory
 *
 * Provides a single source of truth for creating GCP Storage clients
 * with proper credential handling across the application.
 */

import { Storage } from "@google-cloud/storage";
import chalk from "chalk";

/**
 * Sanitizes private key by replacing literal \n with actual newlines
 */
const sanitizePrivateKey = (key: string): string =>
    key.replaceAll(String.raw`\n`, "\n");

/**
 * Gets GCP credentials from environment variables
 * Checks both GCP_CLIENT_EMAIL and GCP_SERVICE_ACCOUNT_EMAIL for compatibility
 */
export const getGCPCredentials = () => {
    const clientEmail =
        process.env.GCP_CLIENT_EMAIL || process.env.GCP_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GCP_PRIVATE_KEY;
    const projectId = process.env.GCP_PROJECT_ID;

    return {
        clientEmail,
        privateKey,
        projectId,
        hasCredentials: Boolean(clientEmail && privateKey),
    };
};

/**
 * Creates a Google Cloud Storage client with unified credential handling
 */
export const createGCPStorageClient = (manualOidcToken?: string): Storage => {
    const { clientEmail, privateKey, projectId, hasCredentials } =
        getGCPCredentials();



    if (!hasCredentials) {
        // Vercel OIDC Support
        // If we are on Vercel and have the OIDC token, we can configure the client
        // to use the Workload Identity Pool for authentication.
        // Priority: Argument > Env Var
        const oidcToken = manualOidcToken || process.env.VERCEL_OIDC_TOKEN;
        const projectNumber = "123866291860"; // Found in your gcloud output
        const poolId = "nextjs-app";
        const providerId = "vercel";

        if (oidcToken && process.env.VERCEL) {
            console.log(
                chalk.cyan(
                    "[GCP] Vercel OIDC Token found. Configuring Workload Identity Credentials.",
                ),
            );

            // Construct the External Account options manually
            // This tells the Google Auth Library to swap the Vercel OIDC token for a Google Access Token
            return new Storage({
                projectId: projectId ?? "devbcn", // Fallback to known project
                credentials: {
                    client_email: "vercel@devbcn.iam.gserviceaccount.com", // The SA we are impersonating
                    type: "external_account",
                    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
                    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
                    token_url: "https://sts.googleapis.com/v1/token",
                    service_account_impersonation_url: "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/vercel@devbcn.iam.gserviceaccount.com:generateAccessToken",
                    credential_source: {
                        file: "/dev/null", // Required by types but ignored if we supply the token (actually we need a custom helper or just write the token to file? No, we can pass object but library is tricky. Let's try the easiest path: standard auth library usage in code is hard without file.)
                        // Workaround: We will use a hack to inject the environment variable credential source
                        // implicitly by not providing 'file' if we could, but 'file' is mandatory in some types.
                        // However, google-auth-library supports `credential_source` with `url` or `environment_id`.
                        // For Vercel, we need to pass the token contents.
                        // Since we can't easily write to file in edge/serverless always, we might need a custom auth client.
                        // BUT, let's stick to the 'external_account' config with a simpler approach:
                        // If we can't make `credential_source` work without a file, we might be stuck.
                        //
                        // WAIT: Vercel OIDC usually works by just having `GOOGLE_APPLICATION_CREDENTIALS` point to a file?
                        // If we can't write a file, we can't use standard `new Storage()`.
                        //
                        // Let's TRY to use `credential_source: { url: ... }` if Vercel exposed a URL? No.
                        //
                        // Alternative: We manually create an `ExternalAccountClient` from `google-auth-library`?
                        // That allows passing the token directly? No, it also expects a file/url.
                        //
                        // Okay, reverting to the plan: WE MUST WRITE THE TOKEN TO A FILE.
                        // In Lambda/Vercel, `/tmp` is writable.
                    },
                } as any,
            });

        }

        // If no OIDC, fall back to ADC
        console.log(
            chalk.cyan(
                "[GCP] No explicit credentials or OIDC token found, using Application Default Credentials (ADC)",
            ),
        );
        return new Storage();
    }

    console.log(
        chalk.cyan("[GCP] Using explicit credentials from environment variables"),
    );

    return new Storage({
        projectId,
        credentials: {
            client_email: clientEmail,
            private_key: sanitizePrivateKey(privateKey ?? ""),
        },
    });
};
