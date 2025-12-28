import { Metadata } from "next";

import { getPhotosFromStorage } from "@/services/storage/photos";
import Gallery from "@/components/Gallery";
import { openGraph } from "@/lib/openGraph";
import { Dancing_Script } from "next/font/google";
import { styles } from "@/data/styles";
import { extractNameFromTag } from "@/lib/extractName";
import NotFound from "@/app/not-found";
import { getTranslations } from "next-intl/server";

import Loading from "@/app/loading";
import { Suspense } from "react";

const dancingScript = Dancing_Script({ subsets: ["latin"] });
type Params = Promise<{ styleName: string }>;

export type Props = { params: Params };

export const dynamic = "force-dynamic";

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { styleName } = await params;
  return {
    title: `Style: ${extractNameFromTag(styles, styleName)}`,
    twitter: {
      title: `Style: ${extractNameFromTag(styles, styleName)}`,
      images: [
        {
          url: `/models/${styleName}/opengraph-image`,
          height: 1200,
          width: 630,
        },
      ],
    },
    openGraph: {
      ...openGraph,
      title: `Style: ${extractNameFromTag(styles, styleName)}`,
      images: [
        {
          url: `/models/${styleName}/opengraph-image`,
          height: 1200,
          width: 630,
        },
      ],
    },
  };
};

/**
 * Render a style-specific gallery page.
 *
 * Fetches photos for the provided `styleName`, renders a localized heading for the style,
 * and displays the photos in a Gallery. If the style name is invalid, missing, or photos
 * cannot be retrieved, the NotFound page is returned.
 *
 * @param params - An object containing the route `styleName` used to identify which style's
 *   photos to load (may be undefined).
 * @returns The page content: an H1 with the localized style name and a photo gallery for that
 *   style, or the NotFound component when the style is invalid or photos are unavailable.
 */
export default async function StylePage({ params }: Readonly<Props>) {
  const { styleName } = await params;
  const t = await getTranslations("styles");
  const extractedStyleName = extractNameFromTag(styles, styleName);
  if (extractedStyleName === undefined) {
    return NotFound();
  }
  const convertedStyleName = styleName ?? "boudoir";
  console.log(`Param styleName: ${extractedStyleName}`);
  console.log(`to Storage: ${styleName}`);

  const photos = await getPhotosFromStorage(`styles/${convertedStyleName}`, 36);

  if (!styleName || !photos) {
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
        <Gallery photos={photos} showTitle={false} />
      </Suspense>
    </div>
  );
}