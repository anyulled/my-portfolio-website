import { Metadata } from "next";
import NotFound from "next/dist/client/components/not-found-error";
import { getFlickrPhotos } from "@/services/flickr";
import Gallery from "@/components/Gallery";
import { openGraph } from "@/lib/openGraph";
import { Dancing_Script } from "next/font/google";
import { extractNameFromTag } from "@/lib/extractName";
import modelData from "@/data/models.json";

const dancingScript = Dancing_Script({ subsets: ["latin"] });

export type Props = {
  params: { modelName: string };
};

export const generateMetadata = async ({
  params: { modelName },
}: Props): Promise<Metadata> => ({
  title: `Model ${extractNameFromTag(modelData.models, modelName)} · Boudoir Barcelona`,
  openGraph: {
    ...openGraph,
    title: `Model ${extractNameFromTag(modelData.models, modelName)} · Boudoir Barcelona`,
  },
});

export default async function ModelPage({ params }: Props) {
  const modelName = extractNameFromTag(modelData.models, params.modelName);
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
