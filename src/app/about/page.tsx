export const dynamic = "force-dynamic";

import { fetchCoverPhotos as fetchCover } from "@/services/photos";
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
    // Uses GCS primary with Flickr fallback
    return await fetchCover(50);
  } catch (error) {
    console.error("[ About ] Error fetching cover photos:", error);
    return null;
  }
};

export default async function BioPage() {
  const images = await fetchCoverPhotos();

  if (images == null) {
    console.error("[ About ] Error fetching cover photos");
  }

  return (
    <AboutContent
      images={images}
      profileImageUrl={profileImageUrl}
      imageThumbnail={imageThumbnail}
    />
  );
}
