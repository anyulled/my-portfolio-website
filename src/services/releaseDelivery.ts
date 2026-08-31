import { archiveReleasePdf } from "@/services/photographyRelease/archive";
import { sendEmail } from "@/services/mailer";
import { randomUUID } from "node:crypto";

export type ReleaseType = "photography" | "model";
export type ReleaseStage =
  "pdf_generation" | "archive" | "photographer_email" | "client_email";

export type ReleaseRequestContext = {
  releaseType: ReleaseType;
  requestId: string;
  vercelRequestId?: string;
};

type ReleaseLog = ReleaseRequestContext & {
  event: string;
  level: "info" | "error";
  stage?: ReleaseStage;
  durationMs?: number;
  archiveName?: string;
  configuration?: {
    archiveBucketConfigured: boolean;
    gcpCredentialsConfigured: boolean;
    smtpConfigured: boolean;
    recipientConfigured: boolean;
  };
  error?: { name: string; message: string };
};

type DeliveryOptions = ReleaseRequestContext & {
  releaseDate: string;
  pdf: Buffer;
  filename: string;
  photographerEmail: string;
  clientEmail: string;
  subject: string;
  photographerText: (archiveName: string) => string;
  clientText: string;
};

export class ReleaseStageError extends Error {
  readonly stage: ReleaseStage;
  readonly archiveName?: string;

  constructor(stage: ReleaseStage, cause: unknown, archiveName?: string) {
    super(getErrorMessage(cause));
    this.name = "ReleaseStageError";
    this.stage = stage;
    this.archiveName = archiveName;
  }
}

export const createReleaseRequestContext = (
  releaseType: ReleaseType,
  request: Request,
): ReleaseRequestContext => ({
  releaseType,
  requestId: randomUUID(),
  vercelRequestId: request.headers.get("x-vercel-id") ?? undefined,
});

export const getReleaseConfigurationStatus = () => ({
  archiveBucketConfigured: Boolean(process.env.GCP_RELEASES_BUCKET),
  gcpCredentialsConfigured: Boolean(
    (process.env.GCP_CLIENT_EMAIL || process.env.GCP_SERVICE_ACCOUNT_EMAIL) &&
    process.env.GCP_PRIVATE_KEY,
  ),
  smtpConfigured: Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS),
  recipientConfigured: Boolean(process.env.RELEASE_RECIPIENT_EMAIL),
});

export const logReleaseEvent = (entry: ReleaseLog): void => {
  const write = entry.level === "error" ? console.error : console.log;
  write(JSON.stringify({ ...entry, timestamp: new Date().toISOString() }));
};

export const runReleaseStage = async <T>(
  context: ReleaseRequestContext,
  stage: ReleaseStage,
  operation: () => Promise<T>,
): Promise<T> => {
  const startedAt = Date.now();
  logReleaseEvent({
    ...context,
    event: "release_stage_started",
    level: "info",
    stage,
  });

  try {
    const result = await operation();
    logReleaseEvent({
      ...context,
      event: "release_stage_completed",
      level: "info",
      stage,
      durationMs: Date.now() - startedAt,
    });
    return result;
  } catch (error) {
    logReleaseEvent({
      ...context,
      event: "release_stage_failed",
      level: "error",
      stage,
      durationMs: Date.now() - startedAt,
      error: getErrorDetails(error),
    });
    throw new ReleaseStageError(stage, error);
  }
};

export const deliverRelease = async ({
  releaseType,
  requestId,
  vercelRequestId,
  releaseDate,
  pdf,
  filename,
  photographerEmail,
  clientEmail,
  subject,
  photographerText,
  clientText,
}: DeliveryOptions): Promise<string> => {
  const context = { releaseType, requestId, vercelRequestId };
  const archiveName = await runReleaseStage(context, "archive", () =>
    archiveReleasePdf(pdf, releaseDate, releaseType),
  );
  const attachment = {
    filename,
    content: pdf,
    contentType: "application/pdf",
  };

  try {
    await runReleaseStage(context, "photographer_email", async () => {
      const delivery = await sendEmail({
        to: photographerEmail,
        subject,
        text: photographerText(archiveName),
        attachments: [attachment],
        logContext: { ...context, stage: "photographer_email" },
      });
      if (!delivery) throw new Error("Mailer returned no delivery result");
    });

    await runReleaseStage(context, "client_email", async () => {
      const delivery = await sendEmail({
        to: clientEmail,
        subject,
        text: clientText,
        attachments: [attachment],
        logContext: { ...context, stage: "client_email" },
      });
      if (!delivery) throw new Error("Mailer returned no delivery result");
    });
  } catch (error) {
    if (error instanceof ReleaseStageError) {
      throw new ReleaseStageError(error.stage, error, archiveName);
    }
    throw error;
  }

  return archiveName;
};

export const getErrorDetails = (error: unknown) => ({
  name: error instanceof Error ? error.name : "UnknownError",
  message: getErrorMessage(error),
});

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
