"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { siTelegram, siWhatsapp } from "simple-icons";
import React from "react";
import { Aref_Ruqaa } from "next/font/google";
import useAnalyticsEventTracker from "@/hooks/eventTracker";
import { submitLeadForm } from "@/lib/gtag";
import { useTranslations } from "next-intl";
import FadeInTitle from "@/components/FadeInTitle";
import * as Sentry from "@sentry/nextjs";

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

export default function ContactForm() {
  const gaEventTracker = useAnalyticsEventTracker("Contact");
  const [sendingForm, setSendingForm] = React.useState<boolean>(false);
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSendingForm(true);
    const formData = new FormData(event.currentTarget);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        setSendingForm(false);
        submitLeadForm();
        gaEventTracker("form_submit", "success");
      } else {
        toast({
          title: "Error",
          description:
            "There was an error submitting your message. Please try again.",
          variant: "destructive",
        });
        setSendingForm(false);
        gaEventTracker("form_submit", "error");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
      setSendingForm(false);
      Sentry.captureException(error);
    }
  };
  const t = useTranslations("contact_form");
  return (
    <section id="book-session" className="py-2">
      <div className="container mx-auto px-6">
        <FadeInTitle delay={1}>
          <h2
            className={`${arefRuqaa.className} text-3xl font-bold text-center mb-8`}
          >
            {t("contact_us")}
          </h2>
        </FadeInTitle>
        <form
          className="max-w-md mx-auto space-y-4"
          onSubmit={handleFormSubmit}
        >
          <Input type="text" name="name" placeholder={t("name")} required />
          <Input type="email" name="email" placeholder={t("email")} required />
          <Textarea name="message" placeholder={t("message")} required />
          <Button
            disabled={sendingForm}
            type="submit"
            className="w-full text-bold bg-primary text-primary-foreground"
          >
            {t("send_message")}
          </Button>
        </form>
        <div className="mt-8 flex justify-center space-x-4">
          <a
            href={"https://wa.me/34638802609"}
            target={"_blank"}
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              className={"bg-whatsapp text-neutral-100"}
            >
              <svg
                role="img"
                viewBox="0 0 24 24"
                className={"h-4 w-4 fill-white mr-1"}
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>WhatsApp</title>
                <path fill={"white"} d={siWhatsapp.path} />
              </svg>
              WhatsApp
            </Button>
          </a>
          <a
            href={"https://t.me/m/1f-erIOJMjhk"}
            target={"_blank"}
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              className={"bg-telegram text-neutral-100"}
            >
              <svg
                role="img"
                viewBox="0 0 24 24"
                className={"w-4 h-4 fill-white mr-1"}
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Telegram</title>
                <path fill={"white"} d={siTelegram.path} />
              </svg>
              Telegram
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
