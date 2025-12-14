import { render, screen } from "@testing-library/react";
import type { Photo } from "@/types/photos";

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

jest.mock("@/services/storage/homepage", () => {
  const listHomepagePhotosMock = jest.fn();

  return {
    __esModule: true,
    listHomepagePhotos: listHomepagePhotosMock,
    default: listHomepagePhotosMock,
  };
});



const createPhoto = (overrides: Partial<Photo> = {}): Photo => ({
  id: overrides.id ?? 1,
  description: overrides.description ?? "desc",
  dateTaken: overrides.dateTaken ?? new Date("2024-01-01T00:00:00Z"),
  dateUpload: overrides.dateUpload ?? new Date("2024-01-01T00:00:00Z"),
  height: overrides.height ?? "200",
  title: overrides.title ?? "Title",
  urlCrop: overrides.urlCrop ?? "https://example.com/crop.jpg",
  urlLarge: overrides.urlLarge ?? "https://example.com/large.jpg",
  urlMedium: overrides.urlMedium ?? "https://example.com/medium.jpg",
  urlNormal: overrides.urlNormal ?? "https://example.com/normal.jpg",
  urlOriginal: overrides.urlOriginal ?? "https://example.com/original.jpg",
  urlThumbnail: overrides.urlThumbnail ?? "https://example.com/thumb.jpg",
  urlSmall: overrides.urlSmall ?? "https://example.com/small.jpg",
  urlZoom: overrides.urlZoom ?? "https://example.com/zoom.jpg",
  views: overrides.views ?? 10,
  width: overrides.width ?? "300",
  tags: overrides.tags ?? "tag1",
  srcSet:
    overrides.srcSet ??
    [
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
  let listHomepagePhotosMock: jest.Mock;

  beforeEach(() => {
    const mockedModule = jest.requireMock("@/services/storage/homepage") as {
      listHomepagePhotos: jest.Mock;
    };

    listHomepagePhotosMock = mockedModule.listHomepagePhotos;
    listHomepagePhotosMock.mockReset();
    jest.clearAllMocks();
  });

  it("renders gallery photos returned by storage", async () => {
    listHomepagePhotosMock.mockResolvedValue([createPhoto({ id: 5 })]);

    await renderHomePage();

    expect(listHomepagePhotosMock).toHaveBeenCalled();
    expect(screen.getByTestId("gallery")).toHaveTextContent("5");
  });

  it("shows an error when no photos are available", async () => {
    listHomepagePhotosMock.mockResolvedValue(null);

    await renderHomePage();

    expect(listHomepagePhotosMock).toHaveBeenCalled();
    expect(
      screen.getByText(/unable to load gallery/i),
    ).toBeInTheDocument();
  });

  it("shows an error message when the bucket is empty", async () => {
    listHomepagePhotosMock.mockResolvedValue([]);

    await renderHomePage();

    expect(listHomepagePhotosMock).toHaveBeenCalled();
    expect(
      screen.getByText(/unable to load gallery/i),
    ).toBeInTheDocument();
  });
});
