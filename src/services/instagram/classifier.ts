import { generateText, Output } from "ai";
import { groq } from "@ai-sdk/groq";
import { getInstagramModel } from "./config";
import {
  classificationSchema,
  type Classification,
  type NormalizedClassification,
} from "./types";

const classificationSystem = `You classify Instagram messages for a Barcelona photography business.

Return only the requested structured object. Use route manual_review unless every required fact for an automatic route is explicit.

model_form requires all of these: the sender identifies as a model or offers modeling services, or proposes professional collaboration/work/create/collab with the photographer while indicating availability in Barcelona; Barcelona is explicitly named; photography, a photo session, or collaboration/work with the photographer is explicitly mentioned. Do not require a fee or rate because the form collects the model's cachet and conditions without accepting the proposal.
pricing requires clear intent to hire the photographer for a photography session for the sender or another person. Missing city or session type does not block pricing when client intent is clear.
manual_review is required when identity or intent is uncertain, or when a model message lacks explicit Barcelona or photography/collaboration language.
ignore is required for unrelated messages without clear photography-client intent or model opportunity.
Detect the language of the message. Do not infer facts from profile appearance, usernames, images, or general geography.`;

const collaborationSignal =
  /\b(?:work|create|collab(?:oration)?|shoot|photoshoot|progetto|lavorare|collaborare|trabajar|crear|colaborar)\b/i;

const availabilitySignal =
  /\b(?:be|visit|visiting|available|availability|stay|tomorrow|today|next week|this week|estar|visitar|disponib|mañana|hoy|semana próxima|essere|visitare|disponib|domani|questa settimana)\b/i;

const isLikelyModelCollaboration = (
  classification: Classification,
  message: string,
): boolean =>
  !classification.isPotentialClient &&
  classification.mentionsBarcelona &&
  collaborationSignal.test(message) &&
  availabilitySignal.test(message);

const determineRoute = (
  classification: Classification,
  isModel: boolean,
  isModelCollaboration: boolean,
): NormalizedClassification["route"] => {
  if (!isModel && !classification.isPotentialClient) {
    return "ignore";
  }

  if (
    isModel &&
    classification.mentionsBarcelona &&
    (classification.mentionsPhotographyWork || isModelCollaboration)
  ) {
    return "model_form";
  }

  if (classification.isPotentialClient && !isModel) {
    return "pricing";
  }

  return "manual_review";
};

const normalizeClassification = (
  classification: Classification,
  message: string,
): NormalizedClassification => {
  const isModelCollaboration = isLikelyModelCollaboration(
    classification,
    message,
  );
  const isModel = classification.isModel || isModelCollaboration;

  return {
    ...classification,
    isModel,
    route: determineRoute(classification, isModel, isModelCollaboration),
  };
};

export const classifyInstagramMessage = async (
  text: string,
): Promise<NormalizedClassification> => {
  const result = await generateText({
    model: groq(getInstagramModel()),
    system: classificationSystem,
    output: Output.object({ schema: classificationSchema }),
    prompt: text,
  });

  return normalizeClassification(
    classificationSchema.parse(result.output),
    text,
  );
};
