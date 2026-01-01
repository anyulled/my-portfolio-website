import { z } from "zod";

export const COLORS = [
    "brown",
    "black",
    "blue",
    "green",
    "red",
    "gray",
    "other",
] as const;

export const PAYMENT_TYPES = ["cash", "bank", "bizum", "paypal", "revolut", "other"] as const;

export const bookingFormSchema = z
    .object({
        fullName: z.string().min(2, { message: "error_full_name" }),
        socialAccount: z.string().min(3, { message: "error_social_account" }),
        email: z.email({ message: "error_email" }),
        country: z.string().min(2, { message: "error_country" }),
        height: z
            .string()
            .refine((val) => !Number.isNaN(Number(val)), { message: "error_height" })
            .refine((val) => Number(val) >= 100 && Number(val) <= 220, {
                message: "error_height",
            }),
        chest: z
            .string()
            .refine((val) => !Number.isNaN(Number(val)), { message: "error_chest" })
            .refine((val) => Number(val) >= 30 && Number(val) <= 150, {
                message: "error_chest",
            }),
        waist: z
            .string()
            .refine((val) => !Number.isNaN(Number(val)), { message: "error_waist" })
            .refine((val) => Number(val) >= 30 && Number(val) <= 150, {
                message: "error_waist",
            }),
        hips: z
            .string()
            .refine((val) => !Number.isNaN(Number(val)), { message: "error_hips" })
            .refine((val) => Number(val) >= 30 && Number(val) <= 150, {
                message: "error_hips",
            }),
        tattoos: z.string().optional(),
        hairColor: z.enum(COLORS, { message: "error_hair_color" }),
        eyeColor: z.enum(COLORS, { message: "error_eye_color" }),
        implants: z.enum(["yes", "no"]),
        startDate: z.string().min(1, { message: "error_startDate" }),
        endDate: z.string().min(1, { message: "error_endDate" }),
        rates: z.string().min(5, { message: "error_rates" }),
        modelRelease: z.enum(["yes", "no"]),
        paymentTypes: z
            .array(z.enum(PAYMENT_TYPES))
            .min(1, { message: "error_payment_type" }),
    })
    .refine(
        (data) => {
            if (data.startDate && data.endDate) {
                const start = new Date(data.startDate);
                const end = new Date(data.endDate);
                return start <= end;
            }
            return true;
        },
        {
            message: "error_date_range",
            path: ["endDate"],
        },
    );

export type FormValues = z.infer<typeof bookingFormSchema>;

export const initialValues: FormValues = {
    fullName: "",
    socialAccount: "",
    email: "",
    country: "",
    height: "",
    chest: "",
    waist: "",
    hips: "",
    tattoos: "",
    hairColor: "brown",
    eyeColor: "brown",
    implants: "no",
    startDate: "",
    endDate: "",
    rates: "",
    modelRelease: "yes",
    paymentTypes: [],
};
