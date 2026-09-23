import AnimatedPackages from "@/components/AnimatedPackages";
import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";

const mockOpenContactDialog = jest.fn();

jest.mock("@/components/ContactDialogContext", () => ({
  useContactDialog: () => ({ openContactDialog: mockOpenContactDialog }),
}));

jest.mock("@gsap/react", () => ({
  useGSAP: (callback: () => void) => callback(),
}));

jest.mock("gsap", () => ({
  __esModule: true,
  default: {
    utils: { toArray: jest.fn(() => []) },
    fromTo: jest.fn(),
  },
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  ),
}));

describe("AnimatedPackages", () => {
  it("opens the shared dialog for the selected package", () => {
    render(
      <AnimatedPackages
        bookNowText="Book now"
        packages={[
          {
            key: "express",
            name: "Express",
            price: "200 €",
            image: "/express.jpg",
            features: [{ icon: null, text: "12 photos" }],
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Book now" }));

    expect(mockOpenContactDialog).toHaveBeenCalledWith("express");
  });
});
