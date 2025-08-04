import { render, screen } from "@testing-library/react";
import TestimonialsPage from "@/app/testimonials/page";
import { getTestimonials, Testimonial } from "@/lib/testimonials";
import { commonBeforeEach } from "@/__tests__/utils/testUtils";

// Mock the testimonials data
jest.mock("@/lib/testimonials", () => {
  const originalModule = jest.requireActual("@/lib/testimonials");
  return {
    ...originalModule,
    getTestimonials: jest.fn()
  };
});

// Mock the components
jest.mock("@/app/testimonials/TestimonialHero", () => ({
  __esModule: true,
  default: () => <div data-testid="testimonial-hero">Mocked Hero</div>
}));

jest.mock("@/app/testimonials/TestimonialsCTA", () => ({
  __esModule: true,
  default: () => <div data-testid="testimonials-cta">Mocked CTA</div>
}));

jest.mock("@/components/TestimonialCard", () => ({
  __esModule: true,
  default: ({ testimonial, index }: {
    testimonial: Testimonial;
    index: number
  }) => (
    <div data-testid={`testimonial-card-${testimonial.id}`}>
      Mocked Card for {testimonial.name} (Index: {index})
    </div>
  )
}));

// Mock next/font/google
jest.mock("next/font/google", () => ({
  Aref_Ruqaa: jest.fn(() => ({ className: "mocked-aref-ruqaa" }))
}));

// Mock next-intl/server
jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(() => Promise.resolve((key: string) => {
    const translations: Record<string, string> = {
      what_our_clients_say: "Mocked What Our Clients Say",
      discover_transformative_experiences: "Mocked Discover Experiences",
      more_client_stories: "Mocked More Client Stories"
    };
    return translations[key] || key;
  }))
}));

describe("TestimonialsPage", () => {
  const mockFeaturedTestimonials: Testimonial[] = [
    {
      id: "1",
      name: "Featured User 1",
      location: "Location 1",
      rating: 5,
      content: "Featured content 1",
      date: "2025-07-31",
      featured: true
    },
    {
      id: "2",
      name: "Featured User 2",
      location: "Location 2",
      rating: 4,
      content: "Featured content 2",
      date: "2025-07-30",
      featured: true
    }
  ];

  const mockRegularTestimonials: Testimonial[] = [
    {
      id: "3",
      name: "Regular User 1",
      location: "Location 3",
      rating: 4,
      content: "Regular content 1",
      date: "2025-07-29",
      featured: false
    }
  ];

  const mockAllTestimonials = [...mockFeaturedTestimonials, ...mockRegularTestimonials];

  beforeEach(() => {
    commonBeforeEach();
    jest.clearAllMocks();
    (getTestimonials as jest.Mock).mockResolvedValue(mockAllTestimonials);
  });

  it("renders the page with all components", async () => {
    const { container } = render(await TestimonialsPage());

    // Check if the hero section is rendered
    expect(screen.getByTestId("testimonial-hero")).toBeInTheDocument();

    // Check if the CTA section is rendered
    expect(screen.getByTestId("testimonials-cta")).toBeInTheDocument();

    // Check if the featured testimonials section is rendered
    expect(screen.getByText("Mocked What Our Clients Say")).toBeInTheDocument();
    expect(screen.getByText("Mocked Discover Experiences")).toBeInTheDocument();

    // Check if the regular testimonials section is rendered
    expect(screen.getByText("Mocked More Client Stories")).toBeInTheDocument();

    // Check if the structured data is included
    const scriptTag = container.querySelector("script[type=\"application/ld+json\"]");
    expect(scriptTag).toBeInTheDocument();

    // Parse the structured data and check its content
    const structuredData = JSON.parse(scriptTag?.innerHTML || "{}");
    expect(structuredData["@context"]).toBe("https://schema.org");
    expect(structuredData["@type"]).toBe("WebPage");
    expect(structuredData.name).toBe("Client Testimonials");
    expect(structuredData.url).toBe("https://boudoir.barcelona/testimonials");
  });

  it("renders the correct number of testimonial cards", async () => {
    render(await TestimonialsPage());

    // Check if all featured testimonial cards are rendered
    mockFeaturedTestimonials.forEach(testimonial => {
      expect(screen.getByTestId(`testimonial-card-${testimonial.id}`)).toBeInTheDocument();
    });

    // Check if all regular testimonial cards are rendered
    mockRegularTestimonials.forEach(testimonial => {
      expect(screen.getByTestId(`testimonial-card-${testimonial.id}`)).toBeInTheDocument();
    });
  });

  it("does not render the regular testimonials section when there are none", async () => {
    // Mock getTestimonials to return only featured testimonials
    (getTestimonials as jest.Mock).mockResolvedValue(mockFeaturedTestimonials);

    render(await TestimonialsPage());

    // The "More Client Stories" heading should not be in the document
    expect(screen.queryByText("Mocked More Client Stories")).not.toBeInTheDocument();
  });

  it("passes the correct indices to testimonial cards", async () => {
    render(await TestimonialsPage());

    // Featured testimonials should have indices starting from 0
    expect(screen.getByText(`Mocked Card for ${mockFeaturedTestimonials[0].name} (Index: 0)`)).toBeInTheDocument();
    expect(screen.getByText(`Mocked Card for ${mockFeaturedTestimonials[1].name} (Index: 1)`)).toBeInTheDocument();

    // Regular testimonials should have indices continuing from featured testimonials
    expect(screen.getByText(`Mocked Card for ${mockRegularTestimonials[0].name} (Index: 2)`)).toBeInTheDocument();
  });
});