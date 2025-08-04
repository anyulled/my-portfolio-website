import { render, screen } from "@testing-library/react";
import TestimonialCard from "@/components/TestimonialCard";
import { Testimonial } from "@/lib/testimonials";
import { commonBeforeEach } from "@/__tests__/utils/testUtils";

// Mock the gsap library and ScrollTrigger plugin
jest.mock("gsap/ScrollTrigger", () => ({
  __esModule: true,
  default: "mocked-scroll-trigger",
  getAll: jest.fn().mockReturnValue([{ kill: jest.fn() }])
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
      }))
    },
    default: {
      registerPlugin: jest.fn(),
      set: jest.fn(),
      to: jest.fn(),
      timeline: jest.fn(() => ({
        to: jest.fn().mockReturnThis()
      }))
    },
    registerPlugin: jest.fn(),
    set: jest.fn(),
    to: jest.fn(),
    timeline: jest.fn(() => ({
      to: jest.fn().mockReturnThis()
    }))
  };
});

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: jest.fn(() => (key: string) => key === "date" ? "en-US" : `translated_${key}`)
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} alt={"test"} />;
  }
}));

describe("TestimonialCard", () => {
  const mockTestimonial: Testimonial = {
    id: "1",
    name: "Test User",
    location: "Test Location",
    rating: 4,
    content: "This is a test testimonial content.",
    date: "2025-07-31",
    featured: true
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
      toJSON: jest.fn()
    }));
  });

  it("renders the testimonial correctly", () => {
    render(<TestimonialCard testimonial={mockTestimonial} index={0} />);

    // Check if the name is rendered
    expect(screen.getByText(mockTestimonial.name)).toBeInTheDocument();

    // Check if the location is rendered
    expect(screen.getByText(mockTestimonial.location)).toBeInTheDocument();

    // Check if the content is rendered
    expect(screen.getByText(`&quot;${mockTestimonial.content}&quot;`)).toBeInTheDocument();

    // Check if the correct number of stars is rendered
    const stars = screen.getAllByTestId("star-icon");
    expect(stars).toHaveLength(mockTestimonial.rating);
  });

  it("renders the image when provided", () => {
    const testimonialWithImage = {
      ...mockTestimonial,
      image: "/test-image.jpg"
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

    // The date should be formatted using toLocaleDateString
    // Since we mocked the date locale to 'en-US', we expect a formatted date
    const formattedDate = new Date(mockTestimonial.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });

  it("applies animation with the correct delay based on index", () => {
    const { gsap } = require("gsap");

    render(<TestimonialCard testimonial={mockTestimonial} index={2} />);

    // Check if gsap.to was called with the correct delay
    expect(gsap.to).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        delay: 2 * 0.1 // index * 0.1
      })
    );
  });
});