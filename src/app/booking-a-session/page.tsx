"use client";

import { useTranslations } from "next-intl";
import { Aref_Ruqaa } from "next/font/google";
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import {
  Controller,
  FieldErrors,
  FieldValues,
  SubmitHandler,
  useForm
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

interface ErrorMessageProps<T extends FieldValues> {
  name: keyof T;
  errors: FieldErrors<T>;
  t: {
    (key: string): string;
    <K extends string>(key: K): string;
  };
}

const ErrorMessage = <T extends FieldValues>({
                                               name,
                                               errors,
                                               t
                                             }: ErrorMessageProps<T>) => {
  const error = errors[name];
  if (!error) return null;

  const errorMessage = error.message as string;

  // Directly use the error message as the translation key if it starts with "error_"
  // Otherwise, use the original error message
  const translatedMessage = errorMessage.startsWith("error_") ? t(errorMessage) : errorMessage;

  return <p className="text-red-500 text-sm mt-1">{translatedMessage}</p>;
};

const COLORS = [
  "brown", "black", "blue", "green", "red", "gray", "other"
] as const;

const PAYMENT_TYPES = ["cash", "bank", "bizum", "paypal", "other"] as const;

const bookingFormSchema = z.object({
  fullName: z.string().min(2, { message: "error_full_name" }),
  socialAccount: z.string().min(3, { message: "error_social_account" }),
  email: z.string().email({ message: "error_email" }),
  country: z.string().min(2, { message: "error_country" }),
  height: z.string()
    .refine(val => !isNaN(Number(val)), { message: "error_height" })
    .refine(val => Number(val) >= 100 && Number(val) <= 220, { message: "error_height" }),
  chest: z.string()
    .refine(val => !isNaN(Number(val)), { message: "error_chest" })
    .refine(val => Number(val) >= 30 && Number(val) <= 150, { message: "error_chest" }),
  waist: z.string()
    .refine(val => !isNaN(Number(val)), { message: "error_waist" })
    .refine(val => Number(val) >= 30 && Number(val) <= 150, { message: "error_waist" }),
  hips: z.string()
    .refine(val => !isNaN(Number(val)), { message: "error_hips" })
    .refine(val => Number(val) >= 30 && Number(val) <= 150, { message: "error_hips" }),
  tattoos: z.string().optional(),
  hairColor: z.enum(COLORS, { message: "error_hair_color" }),
  eyeColor: z.enum(COLORS, { message: "error_eye_color" }),
  implants: z.enum(["yes", "no"]),
  startDate: z.string().min(1, { message: "error_startDate" }),
  endDate: z.string().min(1, { message: "error_endDate" }),
  rates: z.string().min(5, { message: "error_rates" }),
  modelRelease: z.enum(["yes", "no"]),
  paymentTypes: z.array(z.enum(PAYMENT_TYPES)).min(1, { message: "error_payment_type" })
}).refine(
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
    path: ["endDate"]
  }
);

type FormValues = z.infer<typeof bookingFormSchema>;

export default function BookingPage() {
  const t = useTranslations("booking_form");

  /**
   * Handles checkbox change for payment types
   * @param field - The form field from react-hook-form
   * @param type - The payment type value
   * @param checked - Whether the checkbox is checked or not
   */
  const handleCheckboxChange = (
    field: { value: string[]; onChange: (value: string[]) => void },
    type: string,
    checked: boolean
  ) => {
    // If checked, add the type to the array; otherwise, remove it
    const updatedValue = checked
      ? [...field.value, type]
      : field.value.filter((val: string) => val !== type);

    field.onChange(updatedValue);
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      fullName: "",
      socialAccount: "",
      email: "",
      country: "",
      height: "",
      chest: "",
      waist: "",
      hips: "",
      tattoos: "",
      hairColor: "brown" as const,
      eyeColor: "brown" as const,
      implants: "no",
      startDate: "",
      endDate: "",
      rates: "",
      modelRelease: "yes",
      paymentTypes: []
    }
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      const formData = new FormData();

      // Add all form fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(item => formData.append(key, item));
        } else {
          formData.append(key, value);
        }
      });

      const res = await fetch("/api/booking", {
        method: "POST",
        body: formData
      });

      const result = await res.json();

      console.log("== Result ==", result);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message
        });
        reset();
      } else {
        toast({
          title: "Error",
          description: result.message || "There was an error submitting your booking request. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("error", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive"
      });
    }
  };


  return (
    <section className="py-12">
      <div className="container mx-auto px-6">
        <h1
          className={`${arefRuqaa.className} text-4xl font-bold text-center mb-8`}>
          {t("title")}
        </h1>
        <div className="max-w-3xl mx-auto mb-8">
          <p className="text-lg text-center mb-6">
            {t("intro")}
          </p>
        </div>

        <form className="max-w-2xl mx-auto space-y-6"
              onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{t("personal_info")}</h2>

            <div>
              <Label htmlFor="fullName">{t("full_name")} *</Label>
              <Input
                id="fullName"
                placeholder={t("full_name")}
                className={errors.fullName ? "border-red-500" : ""}
                {...register("fullName")}
              />
              <ErrorMessage<FormValues> name="fullName" errors={errors} t={t} />
            </div>

            <div>
              <Label htmlFor="socialAccount">{t("social_account")} *</Label>
              <Input
                id="socialAccount"
                placeholder={t("social_account")}
                className={errors.socialAccount ? "border-red-500" : ""}
                {...register("socialAccount")}
              />
              <ErrorMessage<FormValues> name="socialAccount" errors={errors}
                                        t={t} />
            </div>

            <div>
              <Label htmlFor="email">{t("email")} *</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("email")}
                className={errors.email ? "border-red-500" : ""}
                {...register("email")}
              />
              <ErrorMessage<FormValues> name="email" errors={errors}
                                        t={t} />
            </div>

            <div>
              <Label htmlFor="country">{t("country")} *</Label>
              <Input
                id="country"
                placeholder={t("country")}
                className={errors.country ? "border-red-500" : ""}
                {...register("country")}
              />
              <ErrorMessage<FormValues> name="country" errors={errors} t={t} />
            </div>
          </div>

          <div className="space-y-4">
            <h2
              className="text-xl font-semibold">{t("physical_characteristics")}</h2>

            <div>
              <Label htmlFor="height">{t("height")} *</Label>
              <Input
                id="height"
                type="number"
                placeholder={t("height")}
                className={errors.height ? "border-red-500" : ""}
                {...register("height")}
              />
              <ErrorMessage<FormValues> name="height" errors={errors} t={t} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="chest">{t("chest")} *</Label>
                <Input
                  id="chest"
                  type="number"
                  placeholder={t("chest")}
                  className={errors.chest ? "border-red-500" : ""}
                  {...register("chest")}
                />
                <ErrorMessage<FormValues> name="chest" errors={errors} t={t} />
              </div>
              <div>
                <Label htmlFor="waist">{t("waist")} *</Label>
                <Input
                  id="waist"
                  type="number"
                  placeholder={t("waist")}
                  className={errors.waist ? "border-red-500" : ""}
                  {...register("waist")}
                />
                <ErrorMessage<FormValues> name="waist" errors={errors} t={t} />
              </div>
              <div>
                <Label htmlFor="hips">{t("hips")} *</Label>
                <Input
                  id="hips"
                  type="number"
                  placeholder={t("hips")}
                  className={errors.hips ? "border-red-500" : ""}
                  {...register("hips")}
                />
                <ErrorMessage<FormValues> name="hips" errors={errors} t={t} />
              </div>
            </div>

            <div>
              <Label htmlFor="tattoos">{t("tattoos")}</Label>
              <Input
                id="tattoos"
                placeholder={t("tattoos_placeholder")}
                {...register("tattoos")}
              />
            </div>

            <div>
              <Label htmlFor="hairColor">{t("hair_color")} *</Label>
              <Controller
                name="hairColor"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger id="hairColor"
                                   className={errors.hairColor ? "border-red-500" : ""}>
                      <SelectValue placeholder={t("hair_color")} />
                    </SelectTrigger>
                    <SelectContent>
                      {COLORS.map((color) => (
                        <SelectItem key={color} value={color}>
                          {t(`hair_${color}`) || color.charAt(0).toUpperCase() + color.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <ErrorMessage<FormValues> name="hairColor" errors={errors}
                                        t={t} />
            </div>

            <div>
              <Label htmlFor="eyeColor">{t("eye_color")} *</Label>
              <Controller
                name="eyeColor"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <SelectTrigger id="eyeColor"
                                   className={errors.eyeColor ? "border-red-500" : ""}>
                      <SelectValue placeholder={t("eye_color")} />
                    </SelectTrigger>
                    <SelectContent>
                      {COLORS.map((color) => (
                        <SelectItem key={color} value={color}>
                          {t(`eye_${color}`) || color.charAt(0).toUpperCase() + color.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <ErrorMessage<FormValues> name="eyeColor" errors={errors} t={t} />
            </div>

            <div className="space-y-2">
              <Label>{t("implants")} *</Label>
              <Controller
                name="implants"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="implants-yes" />
                      <Label htmlFor="implants-yes">{t("yes")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="implants-no" />
                      <Label htmlFor="implants-no">{t("no")}</Label>
                    </div>
                  </RadioGroup>
                )}
              />
              <ErrorMessage<FormValues> name="implants" errors={errors} t={t} />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{t("booking_details")}</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">{t("available_from")} *</Label>
                <Input
                  id="startDate"
                  type="date"
                  className={errors.startDate ? "border-red-500" : ""}
                  {...register("startDate")}
                />
                <ErrorMessage<FormValues> name="startDate" errors={errors}
                                          t={t} />
              </div>
              <div>
                <Label htmlFor="endDate">{t("available_until")} *</Label>
                <Input
                  id="endDate"
                  type="date"
                  className={errors.endDate ? "border-red-500" : ""}
                  {...register("endDate")}
                />
                <ErrorMessage<FormValues> name="endDate" errors={errors}
                                          t={t} />
              </div>
            </div>

            <div>
              <Label htmlFor="rates">{t("rates")} *</Label>
              <Textarea
                id="rates"
                placeholder={t("rates_placeholder")}
                className={errors.rates ? "border-red-500" : ""}
                {...register("rates")}
              />
              <ErrorMessage<FormValues> name="rates" errors={errors} t={t} />
            </div>

            <div className="space-y-2">
              <Label>{t("model_release")} *</Label>
              <Controller
                name="modelRelease"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="release-yes" />
                      <Label htmlFor="release-yes">{t("yes")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="release-no" />
                      <Label htmlFor="release-no">{t("no")}</Label>
                    </div>
                  </RadioGroup>
                )}
              />
              <ErrorMessage<FormValues> name="modelRelease" errors={errors}
                                        t={t} />
            </div>

            <div>
              <Label>{t("payment_type")} *</Label>
              <div className="space-y-2 mt-2">
                <Controller
                  name="paymentTypes"
                  control={control}
                  render={({ field }) => (
                    <>
                      {PAYMENT_TYPES.map((type) => (
                        <div key={type}
                             className="flex items-center space-x-2">
                          <Checkbox
                            id={`payment-${type}`}
                            value={type}
                            checked={field.value.includes(type)}
                            onCheckedChange={(checked) => handleCheckboxChange(field, type, checked)}
                          />
                          <Label
                            htmlFor={`payment-${type}`}
                            className="cursor-pointer"
                          >
                            {t(`payment_${type}`)}
                          </Label>
                        </div>
                      ))}
                    </>
                  )}
                />
              </div>
              <ErrorMessage<FormValues> name="paymentTypes" errors={errors}
                                        t={t} />
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full text-bold bg-mocha-mousse-400 text-mocha-mousse-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("submitting") : t("submit")}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
