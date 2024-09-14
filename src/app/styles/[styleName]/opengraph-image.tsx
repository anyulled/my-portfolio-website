import { ImageResponse } from "next/og";
import { extractNameFromTag } from "@/lib/extractName";
import { Dancing_Script } from "next/font/google";

import stylesData from "@/data/styles.json";
import { getFlickrPhotos } from "@/services/flickr";

const dancingScript = Dancing_Script({ subsets: ["latin"] });

export default async function ({ params }: { params: { styleName: string } }) {
  const styleName = extractNameFromTag(stylesData.styles, params.styleName);
  const convertedStyleName = styleName ?? "boudoir";
  const result = await getFlickrPhotos(convertedStyleName, "1");
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
          {styleName}
        </h2>
      </div>
    ),
  );
}
