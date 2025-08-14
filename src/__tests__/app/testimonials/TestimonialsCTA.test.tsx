import { fireEvent, render, screen } from "@testing-library/react";
import TestimonialsCTA from "@/app/testimonials/TestimonialsCTA";
import { commonBeforeEach } from "@/__tests__/utils/testUtils";
import useAnalyticsEventTracker from "@/hooks/eventTracker";

// Mock the gsap library and ScrollTrigger plugin
jest.mock("gsap/ScrollTrigger", () => ({
  __esModule: true,
  default: "mocked-scroll-trigger"
}));

jest.mock("gsap", () => {
  return {
    __esModule: true,
    gsap: {
      registerPlugin: jest.fn(),
      set: jest.fn(),
      to: jest.fn(),
      timeline: jest.fn(() => ({
        to: jest.fn().mockReturnThis()
      })),
    },
    default: {
      registerPlugin: jest.fn(),
      set: jest.fn(),
      to: jest.fn(),
      timeline: jest.fn(() => ({
        to: jest.fn().mockReturnThis()
      })),
    },
    registerPlugin: jest.fn(),
    set: jest.fn(),
    to: jest.fn(),
    timeline: jest.fn(() => ({
      to: jest.fn().mockReturnThis()
    })),
  };
});

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => (key: string) => `translated_${key}`)
}));

// Mock next/font/google
jest.mock("next/font/google", () => ({
  Aref_Ruqaa: jest.fn(() => ({ className: "mocked-aref-ruqaa" }))
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn()
  })),
}));

// Mock the analytics event tracker
jest.mock("@/hooks/eventTracker", () => ({
  __esModule: true,
  default: jest.fn(() => jest.fn())
}));

describe("TestimonialsCTA", () => {
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
      toJSON: jest.fn()
    }));
  });

  it("renders the CTA section correctly", () => {
    render(<TestimonialsCTA />);

    // Check if the title is rendered with the correct translation
    expect(screen.getByText("translated_ready_to_create")).toBeInTheDocument();

    // Check if the subtitle is rendered with the correct translation
    expect(screen.getByText("translated_join_hundreds")).toBeInTheDocument();

    // Check if the button text is rendered with the correct translation
    expect(
      screen.getByText("translated_book_your_session")
    ).toBeInTheDocument();

    // Check if the icon texts are rendered with the correct translations
    expect(screen.getByText("translated_empowering")).toBeInTheDocument();
    expect(screen.getByText("translated_professional")).toBeInTheDocument();
    expect(screen.getByText("translated_five-star")).toBeInTheDocument();
  });

  it("applies the correct font class to the title", () => {
    render(<TestimonialsCTA />);

    // Check if the title has the Aref_Ruqaa font class
    const title = screen.getByText("translated_ready_to_create");
    expect(title).toHaveClass("mocked-aref-ruqaa");
  });

  it("tracks the button click event with analytics", () => {
    const mockTracker = jest.fn();
    (useAnalyticsEventTracker as jest.Mock).mockReturnValue(mockTracker);

    render(<TestimonialsCTA />);

    // Find and click the button
    const button = screen.getByText("translated_book_your_session");
    fireEvent.click(button);

    // Check if the analytics tracker was called with the correct parameters
    expect(mockTracker).toHaveBeenCalledWith("form_submit", "success");
  });

  it("initializes the analytics event tracker with the correct category", () => {
    render(<TestimonialsCTA />);

    // Check if useAnalyticsEventTracker was called with the correct category
    expect(useAnalyticsEventTracker).toHaveBeenCalledWith("testimonials");
  });
});
