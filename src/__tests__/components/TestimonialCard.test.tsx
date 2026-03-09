import { render, screen } from "@testing-library/react";
import TestimonialCard from "@/components/TestimonialCard";
import { Testimonial } from "@/lib/testimonials";
import { commonBeforeEach } from "@/__tests__/utils/testUtils";
import { ClassAttributes, ImgHTMLAttributes, JSX } from "react";

jest.mock("gsap/ScrollTrigger", () => ({
  __esModule: true,
  default: "mocked-scroll-trigger",
  ScrollTrigger: {
    getAll: jest.fn().mockReturnValue([{ kill: jest.fn() }]),
  },
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
      context: jest.fn((func) => {
        func();
        return { revert: jest.fn(), kill: jest.fn(), add: jest.fn() };
      }),
    },
    default: {
      registerPlugin: jest.fn(),
      set: jest.fn(),
      to: jest.fn(),
      timeline: jest.fn(() => ({
        to: jest.fn().mockReturnThis(),
      })),
      context: jest.fn((func) => {
        func();
        return { revert: jest.fn(), kill: jest.fn(), add: jest.fn() };
      }),
    },
    registerPlugin: jest.fn(),
    set: jest.fn(),
    to: jest.fn(),
    timeline: jest.fn(() => ({
      to: jest.fn().mockReturnThis(),
    })),
  };
});
jest.mock("next-intl", () => ({
  useTranslations: jest.fn(
    () => (key: string) => (key === "date" ? "en-US" : `translated_${key}`),
  ),
}));
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

describe("TestimonialCard", () => {
  const mockTestimonial: Testimonial = {
    id: "1",
    name: "Test User",
    location: "Test Location",
    rating: 4,
    content: "This is a test testimonial content",
    date: "2025-07-31",
    featured: true,
  };

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

  it("renders the testimonial correctly", () => {
    render(<TestimonialCard testimonial={mockTestimonial} index={0} />);

    expect(screen.getByText(mockTestimonial.name)).toBeInTheDocument();
    expect(screen.getByText(mockTestimonial.location)).toBeInTheDocument();
    expect(screen.getByTestId("testimonial-content")).toBeInTheDocument();
  });

  it("renders the image when provided", () => {
    const testimonialWithImage = {
      ...mockTestimonial,
      image: "/test-image.jpg",
    };

    render(<TestimonialCard testimonial={testimonialWithImage} index={0} />);

    const image = screen.getByAltText(testimonialWithImage.name);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", testimonialWithImage.image);
  });

  it("does not render an image when not provided", () => {
    render(<TestimonialCard testimonial={mockTestimonial} index={0} />);

    const images = screen.queryAllByRole("img");
    expect(images.length).toBe(0);
  });

  it("formats the date correctly", () => {
    render(<TestimonialCard testimonial={mockTestimonial} index={0} />);

    /*
     * The date should be formatted using toLocaleDateString
     * Since we mocked the date locale to 'en-US', we expect a formatted date
     */
    const formattedDate = new Date(mockTestimonial.date).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );

    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });
});
