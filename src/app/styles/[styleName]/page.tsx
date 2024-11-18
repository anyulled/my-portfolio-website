import { Metadata } from "next";

import { getFlickrPhotos } from "@/services/flickr";
import Gallery from "@/components/Gallery";
import { openGraph } from "@/lib/openGraph";
import { Dancing_Script } from "next/font/google";
import stylesData from "@/data/styles.json";
import { extractNameFromTag } from "@/lib/extractName";
import modelData from "@/data/models";
import NotFound from "@/app/not-found";
import { getTranslations } from "next-intl/server";
import { createFlickr } from "flickr-sdk";

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
          alt: `Model ${extractNameFromTag(modelData, styleName)}`,
        },
      ],
    },
  };
};

export default async function StylePage({ params }: Readonly<Props>) {
  const { styleName } = await params;
  const t = await getTranslations("styles");
  const extractedStyleName = extractNameFromTag(stylesData.styles, styleName);
  if (extractedStyleName === undefined) {
    return NotFound();
  }
  const convertedStyleName = styleName ?? "boudoir";
  console.log(`Param styleName: ${extractedStyleName}`);
  console.log(`to Flickr: ${styleName}`);
  const { flickr } = createFlickr(process.env.FLICKR_API_KEY!);
  const result = await getFlickrPhotos(
    flickr,
    convertedStyleName,
    100,
    false,
    true,
  );

  if (!styleName) {
    return NotFound();
  }

  return (
    <div className={"container mx-auto"}>
      <h1
        className={`${dancingScript.className} pt-44 pb-3 pl-12 lg:pb-12 dark:text-peach-fuzz-400 capitalize`}
      >
        {/* @ts-expect-error i18n issues */}
        {t(styleName.replace("-", "_"))}
      </h1>
      <Gallery photos={result.photos} showTitle={false} />
    </div>
  );
}
