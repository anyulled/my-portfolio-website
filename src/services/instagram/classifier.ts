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

model_form requires all of these: the sender explicitly says they are a model or offer modeling services; Barcelona is explicitly named; paid photography, a fee, cachet, rate, or remuneration is explicitly mentioned.
pricing requires clear intent to hire the photographer for a photography session for the sender or another person. Missing city or session type does not block pricing when client intent is clear.
manual_review is required when identity or intent is uncertain, or when a model message lacks explicit Barcelona or paid-session language.
ignore is required for unrelated messages without clear photography-client intent or model opportunity.
Detect the language of the message. Do not infer facts from profile appearance, usernames, images, or general geography.`;

const normalizeClassification = (
  classification: Classification,
): NormalizedClassification => {
  const isClearModel =
    classification.isModel &&
    classification.mentionsBarcelona &&
    classification.mentionsPaidPhotography;
  const isClearClient =
    classification.isPotentialClient && !classification.isModel;
  const isUnrelated =
    !classification.isModel && !classification.isPotentialClient;

  return {
    ...classification,
    route: isUnrelated
      ? "ignore"
      : isClearModel
        ? "model_form"
        : isClearClient
          ? "pricing"
          : "manual_review",
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

  return normalizeClassification(classificationSchema.parse(result.output));
};
