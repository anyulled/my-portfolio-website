import { Metadata } from "next";
import NotFound from "next/dist/client/components/not-found-error";
import { getFlickrPhotos } from "@/services/flickr";
import Gallery from "@/components/Gallery";
import { openGraph } from "@/lib/openGraph";
import { Dancing_Script } from "next/font/google";
import { extractNameFromTag } from "@/lib/extractName";
import modelData from "@/data/models.json";

const dancingScript = Dancing_Script({ subsets: ["latin"] });
type Params = Promise<{modelName: string}>;

export type Props = { params: Params; };

export const generateMetadata = async ({
  params,
}: {
  params: Params;
}): Promise<Metadata> => {
  const { modelName } = await params
  return {
    title: `Model ${extractNameFromTag(modelData.models, modelName)} · Boudoir Barcelona`,
    openGraph: {
      ...openGraph,
      title: `Model ${extractNameFromTag(modelData.models, modelName)} · Boudoir Barcelona`,
      images: [
        {
          url: `/models/${modelName}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `Model ${extractNameFromTag(modelData.models, modelName)}`,
        },
      ],
    },
  };
};

export default async function ModelPage({ params }: Readonly<Props>) {
  const {modelName} = await params;
  const extractedModelName = extractNameFromTag(modelData.models, modelName);
  const convertedModel = modelName.replaceAll("-", "");
  console.log(`Param ModelName: ${modelName}`);
  console.log(`Extracted from JSON: ${extractedModelName}`);
  console.log(`to Flickr: ${convertedModel}`);
  const result = await getFlickrPhotos(convertedModel, 100);

  if (!modelName) {
    return NotFound();
  }

  return (
    <div className={"container mx-auto"}>
      <h1 className={`${dancingScript.className} pt-44 pb-3 pl-12 lg:pb-12 dark:text-peach-fuzz-400 capitalize`}>
        {extractedModelName}
      </h1>
      <Gallery photos={result.photos} showTitle={false} />
    </div>
  );
}
