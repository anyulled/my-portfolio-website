import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, { message: "error_name" }),
  email: z.email({ message: "error_email" }),
  message: z
    .string()
    .trim()
    .min(200, { message: "error_message_min_length" })
    .refine((value) => /\s/.test(value), {
      message: "error_message_spaces",
    }),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
