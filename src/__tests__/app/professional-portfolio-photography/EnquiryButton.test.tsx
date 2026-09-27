const openContactDialog = jest.fn();

jest.mock("@/components/ContactDialogContext", () => ({
  useContactDialog: () => ({ openContactDialog }),
}));

import EnquiryButton from "@/app/professional-portfolio-photography/EnquiryButton";
import { fireEvent, render, screen } from "@testing-library/react";

describe("portfolio enquiry button", () => {
  it("opens the existing contact form for visitor review", () => {
    render(<EnquiryButton label="Enquire about a portfolio session" />);

    fireEvent.click(
      screen.getByRole("button", { name: "Enquire about a portfolio session" }),
    );

    expect(openContactDialog).toHaveBeenCalledWith();
  });
});
