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
export const createGCPStorageClient = (): Storage => {
    const { clientEmail, privateKey, projectId, hasCredentials } =
        getGCPCredentials();

    if (!hasCredentials) {
        console.log(
            chalk.cyan(
                "[GCP] No explicit credentials found, using Application Default Credentials (ADC)",
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
