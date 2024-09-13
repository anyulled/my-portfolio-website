import { Metadata } from "next";

import modelData from "@/data/models.json";
import NotFound from "next/dist/client/components/not-found-error";
import { getFlickrPhotos } from "@/services/flickr";
import Gallery from "@/components/Gallery";
import { openGraph } from "@/app/lib/openGraph";
import { Dancing_Script } from "next/font/google";

const getModelName = (modelName: string): string | undefined =>
  modelData.models.find((model) => model.tag === modelName)?.name;

const dancingScript = Dancing_Script({ subsets: ["latin"] });

export type Props = {
  params: { modelName: string };
};

export const generateMetadata = async ({
  params: { modelName },
}: Props): Promise<Metadata> => ({
  title: `Model ${getModelName(modelName)} · Boudoir Barcelona`,
  openGraph: {
    ...openGraph,
    title: `Model ${getModelName(modelName)} · Boudoir Barcelona`,
  },
});

export default async function ModelPage({ params }: Props) {
  const modelName = getModelName(params.modelName);
  const convertedModel = params.modelName.replaceAll("-", "");
  console.log(`Param ModelName: ${params.modelName}`);
  console.log(`Extracted from JSON: ${modelName}`);
  console.log(`to Flickr: ${convertedModel}`);
  const result = await getFlickrPhotos(convertedModel);

  if (!modelName) {
    return NotFound();
  }

  return (
    <div className={"container mx-auto"}>
      <h1 className={`${dancingScript.className} pt-44 pb-12`}>{modelName}</h1>
      <Gallery photos={result.photos} showTitle={false} />
    </div>
  );
}
