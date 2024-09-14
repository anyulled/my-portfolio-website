import { Metadata } from "next";

import NotFound from "next/dist/client/components/not-found-error";
import { getFlickrPhotos } from "@/services/flickr";
import Gallery from "@/components/Gallery";
import { openGraph } from "@/lib/openGraph";
import { Dancing_Script } from "next/font/google";
import stylesData from "@/data/styles.json";
import { extractNameFromTag } from "@/lib/extractName";
import modelData from "@/data/models.json";

const dancingScript = Dancing_Script({ subsets: ["latin"] });

export type Props = {
  params: { styleName: string };
};

export const generateMetadata = async ({
  params: { styleName },
}: Props): Promise<Metadata> => ({
  title: `Style ${extractNameFromTag(stylesData.styles, styleName)} · Boudoir Barcelona`,
  openGraph: {
    ...openGraph,
    title: `Style ${extractNameFromTag(stylesData.styles, styleName)} · Boudoir Barcelona`,
    images: [
      {
        url: `/models/${styleName}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: `Model ${extractNameFromTag(modelData.models, styleName)}`,
      },
    ],
  },
});

export default async function StylePage({ params }: Readonly<Props>) {
  const styleName = extractNameFromTag(stylesData.styles, params.styleName);
  const convertedStyleName = styleName ?? "boudoir";
  console.log(`Param ModelName: ${params.styleName}`);
  console.log(`to Flickr: ${styleName}`);
  const result = await getFlickrPhotos(convertedStyleName, "100");

  if (!styleName) {
    return NotFound();
  }

  return (
    <div className={"container mx-auto"}>
      <h1 className={`${dancingScript.className} pt-44 pb-12`}>{styleName}</h1>
      <Gallery photos={result.photos} showTitle={false} />
    </div>
  );
}
