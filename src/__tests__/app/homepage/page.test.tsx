import type { Photo } from "@/types/photos";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/Gallery", () => ({
  __esModule: true,
  default: ({ photos }: { photos: Photo[] }) => (
    <div data-testid="gallery">{photos.map((photo) => photo.id).join(",")}</div>
  ),
}));

jest.mock("@/components/Hero", () => ({
  __esModule: true,
  default: () => <div data-testid="hero" />,
}));

jest.mock("@/components/SocialMedia", () => ({
  __esModule: true,
  default: () => <div data-testid="social-media" />,
}));

jest.mock("@/components/ContactForm", () => ({
  __esModule: true,
  default: () => <div data-testid="contact-form" />,
}));

jest.mock("@/components/ui/separator", () => ({
  Separator: () => <hr data-testid="separator" />,
}));

jest.mock("gsap", () => ({
  __esModule: true,
  default: { registerPlugin: jest.fn() },
}));

jest.mock("@gsap/react", () => ({
  useGSAP: jest.fn(),
}));

jest.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {
    scrollerProxy: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock("@/contexts/ScrollContext", () => ({
  useScroll: jest.fn(() => ({ lenis: null })),
}));

jest.mock("@/services/storage/photos-cached", () => {
  const getPhotosFromStorageMock = jest.fn();

  return {
    __esModule: true,
    getPhotosFromStorage: getPhotosFromStorageMock,
    default: getPhotosFromStorageMock,
  };
});

const createPhoto = (overrides: Partial<Photo> = {}): Photo => ({
  id: overrides.id ?? 1,
  description: overrides.description ?? "desc",
  dateTaken: overrides.dateTaken ?? new Date("2024-01-01T00:00:00Z"),
  dateUpload: overrides.dateUpload ?? new Date("2024-01-01T00:00:00Z"),
  height: overrides.height ?? 200,
  title: overrides.title ?? "Title",
  views: overrides.views ?? 10,
  width: overrides.width ?? 300,
  tags: overrides.tags ?? "tag1",
  srcSet: overrides.srcSet ?? [
    {
      src: "https://example.com/small.jpg",
      width: 300,
      height: 200,
      title: "Title",
      description: "desc",
    },
  ],
});

const renderHomePage = async () => {
  const HomePage = (await import("@/app/page")).default;
  const ui = await HomePage();
  render(ui);
};

describe("HomePage", () => {
  const context = { getPhotosFromStorageMock: null as any };

  beforeEach(() => {
    const mockedModule = jest.requireMock("@/services/storage/photos-cached");

    context.getPhotosFromStorageMock = mockedModule.getPhotosFromStorage;
    context.getPhotosFromStorageMock.mockReset();
    jest.clearAllMocks();
  });

  it("renders gallery photos returned by storage", async () => {
    context.getPhotosFromStorageMock.mockResolvedValue([createPhoto({ id: 5 })]);

    await renderHomePage();

    // Verify calls - gallery fetches from root (empty prefix), hero from "hero" folder
    expect(context.getPhotosFromStorageMock).toHaveBeenCalledWith("", 12);
    expect(context.getPhotosFromStorageMock).toHaveBeenCalledWith("hero", 6);

    expect(screen.getByTestId("gallery")).toHaveTextContent("5");
  });

  it("renders gallery with fallback photos when no photos are available", async () => {
    context.getPhotosFromStorageMock.mockResolvedValue(null);

    await renderHomePage();

    // Verify calls with correct limits - updated loop in component logic restores limits
    expect(context.getPhotosFromStorageMock).toHaveBeenCalledWith("", 12);
    expect(context.getPhotosFromStorageMock).toHaveBeenCalledWith("hero", 6);

    // Expect 1 fallback photo (id 0)
    expect(screen.getByTestId("gallery")).toHaveTextContent("0");
  });

  it("renders gallery with fallback photos when the bucket is empty", async () => {
    context.getPhotosFromStorageMock.mockResolvedValue([]);

    await renderHomePage();

    expect(context.getPhotosFromStorageMock).toHaveBeenCalledWith("", 12);
    expect(screen.getByTestId("gallery")).toHaveTextContent("0");
  });
});
