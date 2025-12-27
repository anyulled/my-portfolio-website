import { getPhotosFromStorage } from "@/services/storage/photos";
import { Metadata } from "next";
import { openGraph } from "@/lib/openGraph";
import AboutContent from "@/components/AboutContent";

//region Images
const profileImageUrl =
  "https://live.staticflickr.com/65535/53985281833_769ef447ff_z.jpg";

const imageThumbnail =
  "https://live.staticflickr.com/65535/53985281833_769ef447ff_c_d.jpg";
//endregion

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
      imageThumbnail={imageThumbnail}
      collaborationImages={collaborationImages}
    />
  );
}
