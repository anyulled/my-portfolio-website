import { Metadata } from "next";
import NotFound from "next/dist/client/components/not-found-error";
import { fetchTransport, getFlickrPhotos } from "@/services/flickr/flickr";
import Gallery from "@/components/Gallery";
import { openGraph } from "@/lib/openGraph";
import { Dancing_Script } from "next/font/google";
import { extractNameFromTag } from "@/lib/extractName";
import models from "@/data/models";
import { createFlickr } from "flickr-sdk";
import Loading from "@/app/loading";
import { Suspense } from "react";

const dancingScript = Dancing_Script({ subsets: ["latin"] });
type Params = Promise<{ modelName: string }>;

export type Props = { params: Params };

export const generateMetadata = async ({
  params,
}: {
  params: Params;
}): Promise<Metadata> => {
  const { modelName } = await params;
  const title = `Model: ${extractNameFromTag(models, modelName)}`;
  return {
    title: title,
    twitter: {
      title: "Pricing",
      description: "Discover our pricing and book your experience today!",
      images: [
        {
          url: `/models/${modelName}/opengraph-image`,
          height: 1200,
          width: 630,
        },
      ],
    },
    openGraph: {
      ...openGraph,
      type: "article",
      title: "Pricing",
      description: "Discover our pricing and book your experience today!",
      images: [
        {
          url: `/models/${modelName}/opengraph-image`,
          height: 1200,
          width: 630,
        },
      ],
    },
  };
};

export const revalidate = 43200;

export async function generateStaticParams() {
  return models.map((model) => ({ modelName: model.tag }));
}

export default async function ModelPage({ params }: Readonly<Props>) {
  const { modelName } = await params;
  const extractedModelName = extractNameFromTag(models, modelName);
  console.log(`Param ModelName: ${modelName}`);
  console.log(`Extracted from Models: ${extractedModelName}`);
  console.log(`to Flickr: ${modelName}`);
  const { flickr } = createFlickr(process.env.FLICKR_API_KEY!, fetchTransport);
  const result = await getFlickrPhotos(flickr, modelName, 100);

  if (!modelName || !result.success) {
    return NotFound();
  }

  return (
    <div className={"container mx-auto"}>
      <h1
        className={`${dancingScript.className} pt-44 pb-3 pl-12 lg:pb-12 capitalize`}
      >
        {extractedModelName}
      </h1>
      <Suspense fallback={<Loading />}>
        <Gallery photos={result.photos} showTitle={false} />
      </Suspense>
    </div>
  );
}
