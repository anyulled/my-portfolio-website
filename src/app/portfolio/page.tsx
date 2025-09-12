import { getFlickrPhotosFromAlbum } from "@/services/flickr/flickr";
import { createFlickr } from "flickr-sdk";

export default async function PortfolioPage() {
  const { flickr } = createFlickr(process.env.FLICKR_API_KEY!);
  const photos = await getFlickrPhotosFromAlbum(flickr, "");
  console.dir(photos);
  return <section>
    <h1>Our Portfolio</h1>
  </section>;
}