import { z } from "zod";
import { portfolioStyles } from "./types";

const isPortfolioSlug = (value: string): boolean =>
  value.split("-").every((segment) => /^[a-z0-9]+$/.test(segment));

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const profileUrlSchema = z.string().url().refine(isHttpUrl);

export const newPortfolioModelSchema = z.object({
  name: z.string().trim().min(1),
  profileUrl: profileUrlSchema,
});

export const collectionDraftSchema = z
  .object({
    id: z.uuid().optional(),
    name: z.string().trim().min(1),
    slug: z.string().refine(isPortfolioSlug),
    sessionDate: z.iso.date(),
    location: z.string().trim().min(1),
    style: z.enum(portfolioStyles),
    lingerieBrand: z.string().trim(),
    modelIds: z.array(z.uuid()),
    newModels: z.array(newPortfolioModelSchema),
    driveImages: z
      .array(
        z.object({
          id: z.string().trim().min(1),
          name: z.string().trim().min(1),
        }),
      )
      .min(1),
  })
  .refine((draft) => draft.modelIds.length + draft.newModels.length > 0, {
    message: "At least one model must be selected",
    path: ["modelIds"],
  })
  .refine(
    (draft) =>
      new Set(draft.driveImages.map((image) => image.id)).size ===
      draft.driveImages.length,
    {
      message: "Each selected image must be unique",
      path: ["driveImages"],
    },
  );

export type ValidatedCollectionDraft = z.infer<typeof collectionDraftSchema>;
