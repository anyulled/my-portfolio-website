import AboutContent from "@/components/AboutContent";
import { openGraph } from "@/lib/openGraph";
import { getPhotosFromStorage } from "@/services/storage/photos";
import { Metadata } from "next";

const profileImageUrl =
  "https://storage.googleapis.com/sensuelle-boudoir-homepage/about/anyul-rivas_53909071543_o.webp";

const metadataImages = [
  {
    alt: "Anyul Rivas",
    url: profileImageUrl,
  },
];
export const metadata: Metadata = {
  title: "About Me",
  description:
    "Anyul Rivas — Professional portrait & Boudoir photographer born in Venezuela and based in Barcelona, Spain",
  twitter: {
    images: metadataImages,
  },
  openGraph: {
    ...openGraph,
    images: metadataImages,
  },
};

const fetchCoverPhotos = async () => {
  try {
    return await getPhotosFromStorage("cover", 50);
  } catch (error) {
    console.error("[ About ] Error fetching photos from storage:", error);
    return null;
  }
};

const fetchCollaborationPhotos = async () => {
  try {
    return await getPhotosFromStorage("collaboration", 4);
  } catch (error) {
    console.error(
      "[ About ] Error fetching collaboration photos from storage:",
      error,
    );
    return null;
  }
};

export default async function BioPage() {
  const images = await fetchCoverPhotos();
  const collaborationImages = await fetchCollaborationPhotos();

  if (images == null) {
    console.error("[ About ] Error fetching cover photos");
  }

  return (
    <AboutContent
      images={images}
      profileImageUrl={profileImageUrl}
      collaborationImages={collaborationImages}
    />
  );
}
