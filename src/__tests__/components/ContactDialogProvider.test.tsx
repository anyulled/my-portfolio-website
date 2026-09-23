import ContactDialogProvider from "@/components/ContactDialogProvider";
import { useContactDialog } from "@/components/ContactDialogContext";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("@/components/ContactForm", () => ({
  __esModule: true,
  default: ({ selectedPackage }: { selectedPackage?: string }) => (
    <output data-testid="selected-package">{selectedPackage ?? "none"}</output>
  ),
}));

jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    open,
    children,
    onOpenChange,
  }: {
    open: boolean;
    children: React.ReactNode;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div>
        {children}
        <button type="button" onClick={() => onOpenChange(false)}>
          Close
        </button>
      </div>
    ) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

function OpenDialogButton() {
  const { openContactDialog } = useContactDialog();
  return (
    <button type="button" onClick={() => openContactDialog("deluxe")}>
      Open
    </button>
  );
}

describe("ContactDialogProvider", () => {
  it("opens the shared form with the requested package", () => {
    render(
      <ContactDialogProvider>
        <OpenDialogButton />
      </ContactDialogProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open" }));

    expect(screen.getByTestId("selected-package")).toHaveTextContent("deluxe");

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByTestId("selected-package")).not.toBeInTheDocument();
  });

  it("provides a safe no-op outside the provider", () => {
    render(<OpenDialogButton />);

    fireEvent.click(screen.getByRole("button", { name: "Open" }));

    expect(screen.queryByTestId("selected-package")).not.toBeInTheDocument();
  });
});
