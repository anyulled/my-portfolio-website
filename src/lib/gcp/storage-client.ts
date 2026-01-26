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

            // Write the token to a temporary file because Google Auth Library expects a file path
            // for 'external_account' credentials.
            // Using /tmp is standard for Vercel/Lambda environments.
            try {
                // Determine temp directory - fallback to /tmp if os.tmpdir() fails or isn't available
                const fs = require("node:fs");
                const path = require("node:path");
                const os = require("node:os");

                const tempDir = os.tmpdir();
                const tokenFilePath = path.join(tempDir, "gcp-oidc-token");

                fs.writeFileSync(tokenFilePath, oidcToken);
                console.log(chalk.cyan(`[GCP] Wrote OIDC token to ${tokenFilePath}`));

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
                            file: tokenFilePath,
                        },
                    } as any,
                });
            } catch (error) {
                console.error(chalk.red("[GCP] Failed to write OIDC token to temp file:"), error);
                // Fallthrough to ADC or throw? If we have a token but can't use it, we should probably throw
                // or let it fall through to ADC which will likely fail too.
            }
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
