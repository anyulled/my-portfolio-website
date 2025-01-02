import { Metadata } from "next";

import { fetchTransport, getFlickrPhotos } from "@/services/flickr";
import Gallery from "@/components/Gallery";
import { openGraph } from "@/lib/openGraph";
import { Dancing_Script } from "next/font/google";
import { styles } from "@/data/styles";
import { extractNameFromTag } from "@/lib/extractName";
import modelData from "@/data/models";
import NotFound from "@/app/not-found";
import { getTranslations } from "next-intl/server";
import { createFlickr } from "flickr-sdk";
import Loading from "@/app/loading";
import { Suspense } from "react";

const dancingScript = Dancing_Script({ subsets: ["latin"] });
type Params = Promise<{ styleName: string }>;

export type Props = { params: Params };

export const revalidate = 43200;

export async function generateStaticParams() {
  return styles.map((style) => ({
    styleName: style.name,
  }));
}

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { styleName } = await params;
  return {
    title: `Style ${extractNameFromTag(styles, styleName)} · Boudoir Barcelona`,
    openGraph: {
      ...openGraph,
      title: `Style ${extractNameFromTag(styles, styleName)} · Boudoir Barcelona`,
      images: [
        {
          url: `/models/${styleName}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `Style ${extractNameFromTag(modelData, styleName)}`,
        },
      ],
    },
  };
};

export default async function StylePage({ params }: Readonly<Props>) {
  const { styleName } = await params;
  const t = await getTranslations("styles");
  const extractedStyleName = extractNameFromTag(styles, styleName);
  if (extractedStyleName === undefined) {
    return NotFound();
  }
  const convertedStyleName = styleName ?? "boudoir";
  console.log(`Param styleName: ${extractedStyleName}`);
  console.log(`to Flickr: ${styleName}`);
  const { flickr } = createFlickr(process.env.FLICKR_API_KEY!, fetchTransport);
  const result = await getFlickrPhotos(
    flickr,
    convertedStyleName,
    48,
    false,
    true,
  );

  if (!styleName || !result.success) {
    return NotFound();
  }

  return (
    <div className="container mx-auto">
      <h1
        className={`${dancingScript.className} pt-44 pb-3 pl-12 lg:pb-12 capitalize`}
      >
        {/* @ts-expect-error i18n issues */}
        {t(styleName.replace("-", "_"))}
      </h1>
      <Suspense fallback={<Loading />}>
        <Gallery photos={result.photos} showTitle={false} />
      </Suspense>
    </div>
  );
}
