"use client";

import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Aref_Ruqaa } from "next/font/google";
import { useForm } from "react-hook-form";
import { BookingDetails } from "./components/BookingDetails";
import { PersonalInformation } from "./components/PersonalInformation";
import { PhysicalCharacteristics } from "./components/PhysicalCharacteristics";
import { useBookingForm } from "./hooks/useBookingForm";
import { bookingFormSchema, FormValues, initialValues } from "./types";

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

export default function BookingPage() {
  const t = useTranslations("booking_form");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: initialValues,
  });

  const { onSubmit } = useBookingForm(reset);

  return (
    <section className="py-12">
      <div className="container mx-auto px-6">
        <h1
          className={`${arefRuqaa.className} text-4xl font-bold text-center mb-8`}
        >
          {t("title")}
        </h1>
        <div className="max-w-3xl mx-auto mb-8">
          <p className="text-lg text-center mb-6">{t("intro")}</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-3xl mx-auto space-y-6 bg-card p-8 rounded-xl shadow-lg border"
        >
          <PersonalInformation register={register} errors={errors} t={t} />
          <PhysicalCharacteristics
            register={register}
            errors={errors}
            control={control}
            t={t}
          />
          <BookingDetails
            register={register}
            errors={errors}
            control={control}
            t={t}
          />

          <div className="pt-6">
            <Button
              type="submit"
              className="w-full py-6"
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
