import Hero from "@/components/Hero";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock dependencies
jest.mock("next/font/google", () => ({
  Aref_Ruqaa: () => ({ className: "mock-aref-ruqaa" }),
  Dancing_Script: () => ({ className: "mock-dancing-script" }),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockFromTo = jest.fn();
jest.mock("gsap", () => ({
  registerPlugin: jest.fn(),
  fromTo: (...args: any[]) => mockFromTo(...args),
}));

// Mock useGSAP to run the effect immediately
jest.mock("@gsap/react", () => ({
  useGSAP: (callback: any) => {
    React.useLayoutEffect(callback, []);
  },
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

describe("Hero Component LCP Optimization", () => {
  const mockImage = {
    image: "/test-image.jpg",
    position: "center center",
    alt: "Test Hero Image",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the hero image immediately visible (no initial opacity: 0)", () => {
    render(<Hero image={mockImage} />);

    // Find the image wrapper. It's the parent of the img tag.
    const img = screen.getByAltText("Test Hero Image");
    const wrapper = img.parentElement;

    /*
     * Check style attribute
     * Note: style prop in React renders as inline style attribute
     */
    expect(wrapper).not.toHaveStyle({ opacity: "0" });
    expect(wrapper).not.toHaveStyle({ opacity: 0 });
  });

  it("does not animate opacity from 0 for the background image", () => {
    render(<Hero image={mockImage} />);

    const img = screen.getByAltText("Test Hero Image");
    const wrapper = img.parentElement;

    const backgroundCallsWithOpacityZero = mockFromTo.mock.calls.filter(
      (call) => call[0] === wrapper && call[1].opacity === 0,
    );

    expect(backgroundCallsWithOpacityZero).toHaveLength(0);
  });
});
