import chalk from "chalk";
import { Metadata } from "next";

import NotFound from "@/app/not-found";
import Gallery from "@/components/Gallery";
import { styles } from "@/data/styles";
import { extractNameFromTag } from "@/lib/extractName";
import { openGraph } from "@/lib/openGraph";
import { getPhotosFromStorage } from "@/services/storage/photos-cached";
import { getTranslations } from "next-intl/server";
import { Dancing_Script } from "next/font/google";

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

export default async function StylePage({ params }: Readonly<Props>) {
  const { styleName } = await params;

  const extractedStyleName = extractNameFromTag(styles, styleName);
  if (extractedStyleName === undefined) {
    return NotFound();
  }

  const convertedStyleName = styleName ?? "boudoir";

  /*
   * ⚡ Bolt: Execute independent asynchronous operations concurrently
   * to eliminate request waterfalls and reduce server response time.
   */
  const [t, photos] = await Promise.all([
    getTranslations("styles"),
    getPhotosFromStorage(`styles/${convertedStyleName}`, 36),
  ]);

  console.log(chalk.cyan(`[Styles] Param styleName: ${extractedStyleName}`));
  console.log(chalk.cyan(`[Styles] to Storage: ${styleName}`));

  if (!styleName || !photos) {
    return NotFound();
  }

  return (
    <div className="container mx-auto">
      <h1
        className={`${dancingScript.className} pt-44 pb-3 pl-12 lg:pb-12 capitalize`}
      >
        {((k: string) => t(k))(styleName.replace("-", "_"))}
      </h1>
      <Suspense fallback={<Loading />}>
        <Gallery photos={photos} showTitle={false} />
      </Suspense>
    </div>
  );
}
