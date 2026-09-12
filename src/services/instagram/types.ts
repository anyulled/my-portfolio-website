import { z } from "zod";

export const instagramHandleSchema = z.enum(["anyulled", "sensuelleboudoir"]);
export type InstagramHandle = z.infer<typeof instagramHandleSchema>;

export const responseRouteSchema = z.enum([
  "model_form",
  "pricing",
  "manual_review",
]);
export type ResponseRoute = z.infer<typeof responseRouteSchema>;

export const classificationRouteSchema = z.enum([
  "model_form",
  "pricing",
  "manual_review",
  "ignore",
]);
export type ClassificationRoute = z.infer<typeof classificationRouteSchema>;

export const processingStateSchema = z.enum([
  "pending",
  "processed",
  "needs_attention",
  "completed",
]);
export type ProcessingState = z.infer<typeof processingStateSchema>;

export const reviewDecisionSchema = z.enum(["model_form", "pricing", "ignore"]);
export type ReviewDecision = z.infer<typeof reviewDecisionSchema>;

export const classificationSchema = z.object({
  route: classificationRouteSchema,
  detectedLanguage: z.string().min(2).max(16),
  confidence: z.number().min(0).max(1),
  isModel: z.boolean(),
  mentionsBarcelona: z.boolean(),
  mentionsPaidPhotography: z.boolean(),
  isPotentialClient: z.boolean(),
  reason: z.string().min(1).max(500),
});
export type Classification = z.infer<typeof classificationSchema>;

export const normalizedClassificationSchema = classificationSchema.extend({
  route: classificationRouteSchema,
});
export type NormalizedClassification = z.infer<
  typeof normalizedClassificationSchema
>;

export interface InstagramConversationRecord {
  id: string;
  accountHandle: InstagramHandle;
  instagramConversationId: string;
  participantId: string;
  participantUsername: string | null;
  lastMessage: string;
  lastMessageAt: string;
  detectedLanguage: string;
  classification: ResponseRoute | "ignored";
  confidence: number;
  processingState: ProcessingState;
  responseRoute: ResponseRoute | null;
  responseSentAt: string | null;
  lastError: string | null;
}

export interface InstagramWebhookMessage {
  accountInstagramUserId: string;
  conversationId: string;
  messageId: string;
  participantId: string;
  participantUsername?: string;
  text: string;
  timestamp: string;
}
