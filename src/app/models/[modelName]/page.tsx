import { Metadata } from "next";
import NotFound from "next/dist/client/components/not-found-error";
import { getFlickrPhotos } from "@/services/flickr";
import Gallery from "@/components/Gallery";
import { openGraph } from "@/lib/openGraph";
import { Dancing_Script } from "next/font/google";
import { extractNameFromTag } from "@/lib/extractName";
import models from "@/data/models";
import { createFlickr } from "flickr-sdk";

const dancingScript = Dancing_Script({ subsets: ["latin"] });
type Params = Promise<{ modelName: string }>;

export type Props = { params: Params };

export const generateMetadata = async ({
  params,
}: {
  params: Params;
}): Promise<Metadata> => {
  const { modelName } = await params;
  return {
    title: `Model ${extractNameFromTag(models, modelName)} · Boudoir Barcelona`,
    openGraph: {
      ...openGraph,
      title: `Model ${extractNameFromTag(models, modelName)} · Boudoir Barcelona`,
      images: [
        {
          url: `/models/${modelName}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `Model ${extractNameFromTag(models, modelName)}`,
        },
      ],
    },
  };
};

export default async function ModelPage({ params }: Readonly<Props>) {
  const { modelName } = await params;
  const extractedModelName = extractNameFromTag(models, modelName);
  console.log(`Param ModelName: ${modelName}`);
  console.log(`Extracted from Models: ${extractedModelName}`);
  console.log(`to Flickr: ${modelName}`);
  const { flickr } = createFlickr(process.env.FLICKR_API_KEY!);
  const result = await getFlickrPhotos(flickr, modelName, 100);

  if (!modelName) {
    return NotFound();
  }

  return (
    <div className={"container mx-auto"}>
      <h1
        className={`${dancingScript.className} pt-44 pb-3 pl-12 lg:pb-12 capitalize`}
      >
        {extractedModelName}
      </h1>
      <Gallery photos={result.photos} showTitle={false} />
    </div>
  );
}
