"use client";

import { useContactDialog } from "@/components/ContactDialogContext";

export default function EnquiryButton({ label }: Readonly<{ label: string }>) {
  const { openContactDialog } = useContactDialog();

  return (
    <button
      type="button"
      onClick={() => openContactDialog()}
      className="rounded-md bg-primary px-6 py-3 text-primary-foreground"
    >
      {label}
    </button>
  );
}
