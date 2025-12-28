/* eslint-disable @next/next/no-img-element */
import { commonBeforeEach } from "@/__tests__/utils/testUtils";
import TestimonialHero from "@/app/testimonials/TestimonialHero";
import { render, screen } from "@testing-library/react";
import { ClassAttributes, ImgHTMLAttributes, JSX } from "react";

// Mock the gsap library and ScrollTrigger plugin
jest.mock("gsap/ScrollTrigger", () => ({
  __esModule: true,
  default: "mocked-scroll-trigger",
}));

jest.mock("gsap", () => {
  return {
    __esModule: true,
    gsap: {
      registerPlugin: jest.fn(),
      set: jest.fn(),
      to: jest.fn(),
      timeline: jest.fn(() => ({
        to: jest.fn().mockReturnThis(),
      })),
    },
    default: {
      registerPlugin: jest.fn(),
      set: jest.fn(),
      to: jest.fn(),
      timeline: jest.fn(() => ({
        to: jest.fn().mockReturnThis(),
      })),
    },
    registerPlugin: jest.fn(),
    set: jest.fn(),
    to: jest.fn(),
    timeline: jest.fn(() => ({
      to: jest.fn().mockReturnThis(),
    })),
  };
});

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => (key: string) => `translated_${key}`),
}));

// Mock next/font/google
jest.mock("next/font/google", () => ({
  Dancing_Script: jest.fn(() => ({ className: "mocked-dancing-script" })),
  Aref_Ruqaa: jest.fn(() => ({ className: "mocked-aref-ruqaa" })),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (
    props: JSX.IntrinsicAttributes &
      ClassAttributes<HTMLImageElement> &
      ImgHTMLAttributes<HTMLImageElement>,
  ) => {
    return <img {...props} alt={props.alt || "test"} />;
  },
}));

describe("TestimonialHero", () => {
  beforeEach(() => {
    commonBeforeEach();
    jest.clearAllMocks();
    // Mock Element.prototype methods used by GSAP
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: jest.fn(),
    }));
  });

  it("renders the hero section correctly", () => {
    render(
      <TestimonialHero image="https://storage.googleapis.com/sensuelle-boudoir-homepage/andrea-cano-montull_54701383010_o.jpg" />,
    );

    // Check if the title is rendered with the correct translation
    expect(
      screen.getByText("translated_client_testimonials"),
    ).toBeInTheDocument();

    // Check if the subtitle is rendered with the correct translation
    expect(screen.getByText("translated_real_stories")).toBeInTheDocument();
  });

  it("applies the correct font classes", () => {
    render(
      <TestimonialHero image="https://storage.googleapis.com/sensuelle-boudoir-homepage/andrea-cano-montull_54701383010_o.jpg" />,
    );

    // Check if the title has the Dancing_Script font class
    const title = screen.getByText("translated_client_testimonials");
    expect(title).toHaveClass("mocked-dancing-script");

    // Check if the subtitle has the Aref_Ruqaa font class
    const subtitle = screen.getByText("translated_real_stories");
    expect(subtitle).toHaveClass("mocked-aref-ruqaa");
  });

  it("renders the background image correctly", () => {
    render(
      <TestimonialHero image="https://storage.googleapis.com/sensuelle-boudoir-homepage/andrea-cano-montull_54701383010_o.jpg" />,
    );

    // Check if the image is rendered with the correct props
    const image = screen.getByAltText("boudoir");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute(
      "src",
      "https://storage.googleapis.com/sensuelle-boudoir-homepage/andrea-cano-montull_54701383010_o.jpg",
    );
    expect(image).toHaveAttribute("width", "1920");
    expect(image).toHaveAttribute("height", "800");
    expect(image).toHaveClass("object-cover");
    expect(image).toHaveClass("h-full");
    expect(image).toHaveClass("opacity-60");
  });
});
