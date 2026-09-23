"use client";

import ContactForm from "@/components/ContactForm";
import {
  ContactDialogContext,
  type ContactPackage,
  type ContactPackageOption,
} from "@/components/ContactDialogContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import React from "react";

export default function ContactDialogProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const t = useTranslations("pricing");
  const [open, setOpen] = React.useState(false);
  const [selectedPackage, setSelectedPackage] =
    React.useState<ContactPackage>();

  const packageOptions: ContactPackageOption[] = [
    { value: "express", label: t("boudoir_express") },
    { value: "experience", label: t("boudoir_experience") },
    { value: "deluxe", label: t("deluxe_experience") },
  ];

  const openContactDialog = React.useCallback(
    (nextPackage?: ContactPackage) => {
      setSelectedPackage(nextPackage);
      setOpen(true);
    },
    [],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSelectedPackage(undefined);
    }
  };

  return (
    <ContactDialogContext.Provider value={{ openContactDialog }}>
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
          <DialogTitle className="sr-only">{t("book_now")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("book_now")}
          </DialogDescription>
          <ContactForm
            selectedPackage={selectedPackage}
            packageOptions={packageOptions}
          />
        </DialogContent>
      </Dialog>
    </ContactDialogContext.Provider>
  );
}
