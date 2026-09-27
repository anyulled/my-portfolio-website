"use client";

import type { ContactPackage } from "@/components/ContactDialogContext";
import { useEffect } from "react";

type BrowserTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; consequentialHint: boolean };
  execute: (input: { package?: string }) => Promise<unknown>;
};

type ModelContext = {
  registerTool: (
    tool: BrowserTool,
    options: { signal: AbortSignal },
  ) => Promise<void>;
};

const isContactPackage = (value: unknown): value is ContactPackage =>
  value === "express" || value === "experience" || value === "deluxe";

export default function WebMcpTools({
  openContactDialog,
}: {
  openContactDialog: (selectedPackage?: ContactPackage) => void;
}) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext })
      .modelContext;
    if (!context) {
      return;
    }

    const controller = new AbortController();
    void context
      .registerTool(
        {
          name: "get_boudoir_services",
          title: "View boudoir packages and photographer details",
          description:
            "Read current package prices, the photographer's background link, and professional portfolio service information. This does not book a session.",
          inputSchema: { type: "object", properties: {} },
          annotations: { readOnlyHint: true, consequentialHint: false },
          execute: async () => {
            const response = await fetch("/api/assistant-information");
            if (!response.ok) {
              throw new Error("Service information is unavailable");
            }
            return (await response.json()) as unknown;
          },
        },
        { signal: controller.signal },
      )
      .catch(() => undefined);
    void context
      .registerTool(
        {
          name: "open_session_enquiry",
          title: "Open a session enquiry form",
          description:
            "Open the website's contact form for the visitor to review and submit a session enquiry. This does not send a message, reserve a date, or confirm a booking.",
          inputSchema: {
            type: "object",
            properties: {
              package: {
                type: "string",
                enum: ["express", "experience", "deluxe"],
              },
            },
          },
          annotations: { readOnlyHint: false, consequentialHint: false },
          execute: async (input) => {
            if (
              input.package !== undefined &&
              !isContactPackage(input.package)
            ) {
              throw new Error("Unknown package");
            }
            openContactDialog(input.package);
            return { status: "form_opened", submissionRequired: true };
          },
        },
        { signal: controller.signal },
      )
      .catch(() => undefined);

    return () => controller.abort();
  }, [openContactDialog]);

  return null;
}
