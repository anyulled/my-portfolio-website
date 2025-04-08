"use client";

import { useTranslations } from "next-intl";
import { Aref_Ruqaa } from "next/font/google";
import React, { useEffect, useState } from "react";
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

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

const COLORS = [
  "brown", "black", "blue", "green", "red", "gray", "other"
] as const;

const PAYMENT_TYPES = ["cash", "bankTransfer", "bizum", "paypal", "other"] as const;

const bookingFormSchema = z.object({
  fullName: z.string().min(2, { message: "error_full_name" }),
  socialAccount: z.string().min(3, { message: "error_social_account" }),
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

interface FormErrors {
  fullName?: string;
  socialAccount?: string;
  country?: string;
  height?: string;
  chest?: string;
  waist?: string;
  hips?: string;
  hairColor?: string;
  eyeColor?: string;
  implants?: string;
  startDate?: string;
  endDate?: string;
  rates?: string;
  modelRelease?: string;
  paymentTypes?: string;
}

type FormValues = z.infer<typeof bookingFormSchema>;

export default function BookingPage() {
  const t = useTranslations("booking_form");
  const [sendingForm, setSendingForm] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formValues, setFormValues] = useState<FormValues>({
    fullName: "",
    socialAccount: "",
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
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: string): string | undefined => {
    if (!bookingFormSchema.shape || !(name in bookingFormSchema.shape)) {
      return undefined;
    }

    const fieldSchema = z.object({ [name]: bookingFormSchema.shape[name as keyof FormValues] });

    try {
      fieldSchema.parse({ [name]: value });
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(err => err.path[0] === name);
        if (fieldError) {
          return t(fieldError.message as any) || fieldError.message;
        }
      }
      return undefined;
    }
  };

  const validateDateRange = (): string | undefined => {
    if (formValues.startDate && formValues.endDate) {
      try {
        bookingFormSchema.parse(formValues);
        return undefined;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const dateRangeError = error.errors.find(err => err.path.includes("endDate") && err.message === "error_date_range");
          if (dateRangeError) {
            return t("error_date_range") || "End date must be after start date";
          }
        }
      }
    }
    return undefined;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleRadioChange = (name: string, value: string) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleCheckboxChange = (value: string, checked: boolean) => {
    setFormValues(prev => {
      const currentPaymentTypes = [...prev.paymentTypes];
      if (checked) {
        if (!currentPaymentTypes.includes(value as any)) {
          currentPaymentTypes.push(value as any);
        }
      } else {
        const index = currentPaymentTypes.indexOf(value as any);
        if (index !== -1) {
          currentPaymentTypes.splice(index, 1);
        }
      }
      return { ...prev, paymentTypes: currentPaymentTypes };
    });
    setTouched(prev => ({ ...prev, paymentTypes: true }));
  };

  useEffect(() => {
    const newErrors: FormErrors = {};

    Object.keys(touched).forEach(fieldName => {
      if (touched[fieldName]) {
        const fieldValue = formValues[fieldName as keyof FormValues];
        const error = validateField(fieldName, fieldValue);
        if (error) {
          newErrors[fieldName as keyof FormErrors] = error;
        }
      }
    });

    if (touched.startDate && touched.endDate) {
      const dateRangeError = validateDateRange();
      if (dateRangeError) {
        newErrors.endDate = dateRangeError;
      }
    }

    setErrors(newErrors);
  }, [formValues, touched]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    try {
      bookingFormSchema.parse(formValues);
      setErrors({});
      return true;
    } catch (error) {
      console.error(error);
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          const fieldName = err.path[0] as keyof FormErrors;
          newErrors[fieldName] = t(err.message as any) || err.message;
        });
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const allTouched: Record<string, boolean> = {};
    Object.keys(formValues).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: t("validation_error") || "Please correct the errors in the form",
        variant: "destructive"
      });
      return;
    }

    setSendingForm(true);
    const formData = new FormData(event.currentTarget);

    try {
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
        setSendingForm(false);
        setFormValues({
          fullName: "",
          socialAccount: "",
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
        });
        setTouched({});
      } else {
        toast({
          title: "Error",
          description: result.message || "There was an error submitting your booking request. Please try again.",
          variant: "destructive"
        });
        setSendingForm(false);
      }
    } catch (error) {
      console.error("error", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive"
      });
      setSendingForm(false);
    }
  };

  const ErrorMessage = ({ error }: { error?: string }) => {
    if (!error) return null;
    return <p className="text-red-500 text-sm mt-1">{error}</p>;
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
              onSubmit={handleFormSubmit}>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{t("personal_info")}</h2>

            <div>
              <Label htmlFor="fullName">{t("full_name")} *</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder={t("full_name")}
                value={formValues.fullName}
                onChange={handleInputChange}
                onBlur={() => setTouched(prev => ({ ...prev, fullName: true }))}
                className={errors.fullName ? "border-red-500" : ""}
                required
              />
              <ErrorMessage error={errors.fullName} />
            </div>

            <div>
              <Label htmlFor="socialAccount">{t("social_account")} *</Label>
              <Input
                id="socialAccount"
                name="socialAccount"
                placeholder={t("social_account")}
                value={formValues.socialAccount}
                onChange={handleInputChange}
                onBlur={() => setTouched(prev => ({
                  ...prev,
                  socialAccount: true
                }))}
                className={errors.socialAccount ? "border-red-500" : ""}
                required
              />
              <ErrorMessage error={errors.socialAccount} />
            </div>

            <div>
              <Label htmlFor="country">{t("country")} *</Label>
              <Input
                id="country"
                name="country"
                placeholder={t("country")}
                value={formValues.country}
                onChange={handleInputChange}
                onBlur={() => setTouched(prev => ({ ...prev, country: true }))}
                className={errors.country ? "border-red-500" : ""}
                required
              />
              <ErrorMessage error={errors.country} />
            </div>
          </div>

          <div className="space-y-4">
            <h2
              className="text-xl font-semibold">{t("physical_characteristics")}</h2>

            <div>
              <Label htmlFor="height">{t("height")} *</Label>
              <Input
                id="height"
                name="height"
                type="number"
                placeholder={t("height")}
                value={formValues.height}
                onChange={handleInputChange}
                onBlur={() => setTouched(prev => ({ ...prev, height: true }))}
                className={errors.height ? "border-red-500" : ""}
                required
              />
              <ErrorMessage error={errors.height} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="chest">{t("chest")} *</Label>
                <Input
                  id="chest"
                  name="chest"
                  type="number"
                  placeholder={t("chest")}
                  value={formValues.chest}
                  onChange={handleInputChange}
                  onBlur={() => setTouched(prev => ({ ...prev, chest: true }))}
                  className={errors.chest ? "border-red-500" : ""}
                  required
                />
                <ErrorMessage error={errors.chest} />
              </div>
              <div>
                <Label htmlFor="waist">{t("waist")} *</Label>
                <Input
                  id="waist"
                  name="waist"
                  type="number"
                  placeholder={t("waist")}
                  value={formValues.waist}
                  onChange={handleInputChange}
                  onBlur={() => setTouched(prev => ({ ...prev, waist: true }))}
                  className={errors.waist ? "border-red-500" : ""}
                  required
                />
                <ErrorMessage error={errors.waist} />
              </div>
              <div>
                <Label htmlFor="hips">{t("hips")} *</Label>
                <Input
                  id="hips"
                  name="hips"
                  type="number"
                  placeholder={t("hips")}
                  value={formValues.hips}
                  onChange={handleInputChange}
                  onBlur={() => setTouched(prev => ({ ...prev, hips: true }))}
                  className={errors.hips ? "border-red-500" : ""}
                  required
                />
                <ErrorMessage error={errors.hips} />
              </div>
            </div>

            <div>
              <Label htmlFor="tattoos">{t("tattoos")}</Label>
              <Input
                id="tattoos"
                name="tattoos"
                placeholder={t("tattoos_placeholder")}
                value={formValues.tattoos}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="hairColor">{t("hair_color")} *</Label>
              <Select
                name="hairColor"
                value={formValues.hairColor}
                onValueChange={(value) => handleSelectChange("hairColor", value)}
                required
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
              <ErrorMessage error={errors.hairColor} />
            </div>

            <div>
              <Label htmlFor="eyeColor">{t("eye_color")} *</Label>
              <Select
                name="eyeColor"
                value={formValues.eyeColor}
                onValueChange={(value) => handleSelectChange("eyeColor", value)}
                required
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
              <ErrorMessage error={errors.eyeColor} />
            </div>

            <div className="space-y-2">
              <Label>{t("implants")} *</Label>
              <RadioGroup
                name="implants"
                value={formValues.implants}
                onValueChange={(value) => handleRadioChange("implants", value)}
                required
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
              <ErrorMessage error={errors.implants} />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{t("booking_details")}</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">{t("available_from")} *</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formValues.startDate}
                  onChange={handleInputChange}
                  onBlur={() => setTouched(prev => ({
                    ...prev,
                    startDate: true
                  }))}
                  className={errors.startDate ? "border-red-500" : ""}
                  required
                />
                <ErrorMessage error={errors.startDate} />
              </div>
              <div>
                <Label htmlFor="endDate">{t("available_until")} *</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formValues.endDate}
                  onChange={handleInputChange}
                  onBlur={() => setTouched(prev => ({
                    ...prev,
                    endDate: true
                  }))}
                  className={errors.endDate ? "border-red-500" : ""}
                  required
                />
                <ErrorMessage error={errors.endDate} />
              </div>
            </div>

            <div>
              <Label htmlFor="rates">{t("rates")} *</Label>
              <Textarea
                id="rates"
                name="rates"
                placeholder={t("rates_placeholder")}
                value={formValues.rates}
                onChange={handleInputChange}
                onBlur={() => setTouched(prev => ({ ...prev, rates: true }))}
                className={errors.rates ? "border-red-500" : ""}
                required
              />
              <ErrorMessage error={errors.rates} />
            </div>

            <div className="space-y-2">
              <Label>{t("model_release")} *</Label>
              <RadioGroup
                name="modelRelease"
                value={formValues.modelRelease}
                onValueChange={(value) => handleRadioChange("modelRelease", value)}
                required
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
              <ErrorMessage error={errors.modelRelease} />
            </div>

            <div>
              <Label>{t("payment_type")} *</Label>
              <div className="space-y-2 mt-2">
                {PAYMENT_TYPES.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`payment-${type}`}
                      name="paymentTypes"
                      value={type}
                      checked={formValues.paymentTypes.includes(type as any)}
                      onCheckedChange={(checked) => handleCheckboxChange(type, checked as boolean)}
                    />
                    <Label
                      htmlFor={`payment-${type}`}
                      className="cursor-pointer"
                    >
                      {t(`payment_${type}`)}
                    </Label>
                  </div>
                ))}
              </div>
              <ErrorMessage error={errors.paymentTypes} />
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full text-bold bg-mocha-mousse-400 text-mocha-mousse-50"
              disabled={sendingForm}
            >
              {sendingForm ? t("submitting") : t("submit")}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
