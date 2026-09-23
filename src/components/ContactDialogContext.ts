"use client";

import React from "react";

export type ContactPackage = "express" | "experience" | "deluxe";

export interface ContactPackageOption {
  value: ContactPackage;
  label: string;
}

interface ContactDialogContextValue {
  openContactDialog: (selectedPackage?: ContactPackage) => void;
}

export const ContactDialogContext =
  React.createContext<ContactDialogContextValue>({
    openContactDialog: () => undefined,
  });

export function useContactDialog() {
  return React.useContext(ContactDialogContext);
}
