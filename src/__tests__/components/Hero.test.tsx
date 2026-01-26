import Hero from "@/components/Hero";
import { render, screen } from "@testing-library/react";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("next/font/google", () => ({
  Aref_Ruqaa: () => ({ className: "aref-ruqaa" }),
  Dancing_Script: () => ({ className: "dancing-script" }),
}));

jest.mock("@gsap/react", () => ({
  useGSAP: jest.fn(),
}));

jest.mock("gsap", () => ({
  registerPlugin: jest.fn(),
  fromTo: jest.fn(),
}));

describe("Hero", () => {
  it("renders with provided image", () => {
    const image = {
      image: "/test.jpg",
      position: "center",
    };

    const { container } = render(<Hero image={image} />);

    expect(screen.getByText("Sensuelle Boudoir")).toBeInTheDocument();

    // Check for background image style
    // The background div is the first child of the section
    // Or we can query by style.
    // simpler: check if the URL is in the HTML
    // Note: Quotes might be stripped by the browser/DOM
    expect(container.innerHTML).toContain("test.jpg");
  });

  it("renders text without background if no image is provided", () => {
     render(<Hero image={null} />);
     expect(screen.getByText("Sensuelle Boudoir")).toBeInTheDocument();
  });
});
