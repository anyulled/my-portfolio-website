import { Metadata } from "next";
import { getPhotosFromStorage } from "@/services/storage/photos";
import Gallery from "@/components/Gallery";
import { openGraph } from "@/lib/openGraph";
import { Dancing_Script } from "next/font/google";
import { extractNameFromTag } from "@/lib/extractName";
import models from "@/data/models";

import Loading from "@/app/loading";
import { Suspense } from "react";
import { notFound } from "next/navigation";

const dancingScript = Dancing_Script({ subsets: ["latin"] });
type Params = Promise<{ modelName: string }>;

export type Props = { params: Params };
export const dynamic = "force-dynamic";

export const generateMetadata = async ({
  params,
}: {
  params: Params;
}): Promise<Metadata> => {
  const { modelName } = await params;
  const title = `Model: ${extractNameFromTag(models, modelName)}`;
  const images = [
    {
      url: `/models/${modelName}/opengraph-image`,
      height: 1200,
      width: 630,
    },
  ];

  const description = `Photographies with Model ${modelName} for Boudoir Barcelona`;
  return Promise.resolve({
    title: title,
    twitter: {
      title: title,
      description: description,
      images: images,
    },
    openGraph: {
      ...openGraph,
      type: "article",
      title: title,
      description: description,
      images: images,
    },
  });
};

const fetchPhotos = async (modelName: string) => {
  try {
    return (await getPhotosFromStorage(`models/${modelName}`, 100)) || [];
  } catch (error) {
    console.error("Error fetching photos from storage:", error);
    return [];
  }
};

/**
 * Render the page for a model identified by params.modelName.
 *
 * Fetches the model's photos and renders a page with the model name header and a photo gallery;
 * triggers a 404 response when `modelName` is missing.
 *
 * @param params - Route parameters containing `modelName`
 * @returns A React element for the model page, or the 404 response when `modelName` is not provided
 */
export default async function ModelPage({ params }: Readonly<Props>) {
  const { modelName } = await params;
  if (!modelName) {
    return notFound();
  }
  const extractedModelName = extractNameFromTag(models, modelName);
  const photos = await fetchPhotos(modelName);

  return (
    <div className={"container mx-auto"}>
      <h1
        className={`${dancingScript.className} pt-44 pb-3 pl-12 lg:pb-12 capitalize`}
      >
        Model: {extractedModelName}
      </h1>
      <Suspense fallback={<Loading />}>
        <Gallery photos={photos} showTitle={false} />
      </Suspense>
    </div>
  );
}