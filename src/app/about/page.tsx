import { getFlickrPhotos } from "@/services/flickr/flickr";
import { Metadata } from "next";
import { openGraph } from "@/lib/openGraph";
import { createFlickr } from "flickr-sdk";
import AboutContent from "@/components/AboutContent";

const profileImageUrl =
  "https://live.staticflickr.com/65535/53985281833_769ef447ff_z.jpg";

const imageThumbnail =
  "https://live.staticflickr.com/65535/53985281833_769ef447ff_c_d.jpg";

const metadataImages = [
  {
    alt: "Anyul Rivas",
    url: profileImageUrl,
  },
];
export const metadata: Metadata = {
  title: "About Me",
  description: "Anyul Rivas — Boudoir photographer in Barcelona, Spain",
  twitter: {
    images: metadataImages,
  },
  openGraph: {
    ...openGraph,
    images: metadataImages,
  },
};

export default async function BioPage() {
  const { flickr } = createFlickr(process.env.FLICKR_API_KEY!);
  const images = await getFlickrPhotos(flickr, "cover", 50);

  return (
    <AboutContent
      images={images}
      profileImageUrl={profileImageUrl}
      imageThumbnail={imageThumbnail}
    />
  );
}
