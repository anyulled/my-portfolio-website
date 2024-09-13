import { Metadata } from "next";

import NotFound from "next/dist/client/components/not-found-error";
import { getFlickrPhotos } from "@/services/flickr";
import Gallery from "@/components/Gallery";
import { openGraph } from "@/app/lib/openGraph";
import { Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({ subsets: ["latin"] });

export type Props = {
  params: { styleName: string };
};

export const generateMetadata = async ({
  params: { styleName },
}: Props): Promise<Metadata> => ({
  title: `Style ${styleName} · Boudoir Barcelona`,
  openGraph: {
    ...openGraph,
    title: `Style ${styleName} · Boudoir Barcelona`,
  },
});

export default async function StylePage({ params }: Props) {
  const convertedStyle = params.styleName.replaceAll("-", "");
  console.log(`Param ModelName: ${params.styleName}`);
  console.log(`to Flickr: ${convertedStyle}`);
  const result = await getFlickrPhotos(convertedStyle, "50");

  if (!convertedStyle) {
    return NotFound();
  }

  return (
    <div className={"container mx-auto"}>
      <h1 className={`${dancingScript.className} pt-44 pb-12`}>
        {convertedStyle}
      </h1>
      <Gallery photos={result.photos} showTitle={false} />
    </div>
  );
}
