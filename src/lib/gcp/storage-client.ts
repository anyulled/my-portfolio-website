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
 * and handling quotes that might be included in the environment variable.
 */
const sanitizePrivateKey = (key: string | undefined): string => {
    if (!key) return "";

    // Replace literal \n with actual newlines
    let sanitized = key.replaceAll(String.raw`\n`, "\n");

    // Remove wrapping quotes if they exist (sometimes Vercel Env UI adds them)
    if (sanitized.startsWith('"') && sanitized.endsWith('"')) {
        sanitized = sanitized.slice(1, -1);
    }

    return sanitized;
};

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
 * Creates a Google Cloud Storage client with unified credential handling.
 * Prioritizes explicit Service Account credentials from environment variables.
 */
export const createGCPStorageClient = (): Storage => {
    const { clientEmail, privateKey, projectId, hasCredentials } =
        getGCPCredentials();

    if (!hasCredentials) {
        console.log(
            chalk.yellow(
                "[GCP] Missing explicit credentials (GCP_CLIENT_EMAIL/GCP_PRIVATE_KEY).",
            ),
        );
        console.log(
            chalk.cyan(
                "[GCP] Falling back to Application Default Credentials (ADC).",
            ),
        );
        return new Storage();
    }

    console.log(
        chalk.green("[GCP] Using explicit Service Account credentials."),
    );

    return new Storage({
        projectId,
        credentials: {
            client_email: clientEmail,
            private_key: sanitizePrivateKey(privateKey),
        },
    });
};
