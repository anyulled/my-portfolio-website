import { Metadata } from "next";

import { getFlickrPhotos } from "@/services/flickr";
import Gallery from "@/components/Gallery";
import { openGraph } from "@/lib/openGraph";
import { Dancing_Script } from "next/font/google";
import stylesData from "@/data/styles.json";
import { extractNameFromTag } from "@/lib/extractName";
import modelData from "@/data/models.json";
import NotFound from "@/app/not-found";
import { Suspense } from "react";
import Loading from "@/app/loading";

const dancingScript = Dancing_Script({ subsets: ["latin"] });
type Params = Promise<{ styleName: string }>;

export type Props = { params: Params };

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { styleName } = await params;
  return {
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
  };
};

export default async function StylePage({ params }: Readonly<Props>) {
  const { styleName } = await params;
  const extractedStyleName = extractNameFromTag(stylesData.styles, styleName);
  if (extractedStyleName === undefined) {
    return NotFound();
  }
  const convertedStyleName = styleName ?? "boudoir";
  console.info(`Param styleName: ${extractedStyleName}`);
  console.info(`to Flickr: ${styleName}`);
  const result = await getFlickrPhotos(convertedStyleName, 100, false, true);

  if (!styleName) {
    return NotFound();
  }

  return (
    <div className={"container mx-auto"}>
      <h1
        className={`${dancingScript.className} pt-44 pb-3 pl-12 lg:pb-12 dark:text-peach-fuzz-400 capitalize`}
      >
        {extractedStyleName}
      </h1>
      <Suspense fallback={<Loading />}>
        <Gallery photos={result.photos} showTitle={false} />
      </Suspense>
    </div>
  );
}
