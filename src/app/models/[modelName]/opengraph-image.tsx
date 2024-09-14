import { ImageResponse } from "next/og";
import { extractNameFromTag } from "@/lib/extractName";
import { Dancing_Script } from "next/font/google";
import { getFlickrPhotos } from "@/services/flickr";
import modelData from "@/data/models.json";

const dancingScript = Dancing_Script({ subsets: ["latin"] });

export const runtime = "edge";

export default async function OpengraphImage({
  params,
}: {
  params: { modelName: string };
}) {
  const modelName = extractNameFromTag(modelData.models, params.modelName);
  const convertedModel = params.modelName.replaceAll("-", "");
  const result = await getFlickrPhotos(convertedModel, "1");
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: "black",
          backgroundImage: ` url(${result.photos?.at(0)?.urlNormal})`,
          backgroundPosition: "center",
          width: "100%",
          flexDirection: "column",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1
          className={`${dancingScript.className} text-5xl text-white pt-12 mb-2 mt-0 drop-shadow-2xl`}
        >
          Sensuelle Boudoir
        </h1>
        <h2 className={"text-3xl text-neutral-500 m-0 drop-shadow-2xl"}>
          {modelName}
        </h2>
      </div>
    ),
  );
}
