import Image from "next/image";
import Link from "next/link";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import models, { Model } from "@/data/models";
import { Metadata } from "next";
import { createFlickr } from "flickr-sdk";
import { getFlickrPhotos, Photo } from "@/services/flickr";

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const dancingScript = Dancing_Script({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Models",
};

const batchModels = (models: Model[], batchSize: number) => {
  const batches = [];
  for (let i = 0; i < models.length; i += batchSize) {
    batches.push(models.slice(i, i + batchSize));
  }
  return batches;
};

export default async function ModelIndexPage() {
  const { flickr } = createFlickr(process.env.FLICKR_API_KEY!);
  const modelBatches = batchModels(models, 20);
  const allPhotos: Photo[] = [];

  for (const batch of modelBatches) {
    const res = await getFlickrPhotos(
      flickr,
      batch.map((style) => style.tag.replace("-", "")).join(", "),
      100,
      false,
      true,
    );
    if (res.success && res.photos != null) {
      allPhotos.push(...res.photos);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 to-neutral-800 text-neutral-100">
      <div className="container mx-auto px-4 py-16">
        <h1
          className={`${dancingScript.className} text-5xl md:text-7xl mb-4 text-center`}
        >
          Els Nostres Models
        </h1>
        <p
          className={`${arefRuqaa.className} text-xl md:text-2xl text-neutral-300 text-center mb-12`}
        >
          Descobreix el talent que fa brillar les nostres fotografies
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {models.map((model) => {
            const matchedPhoto = allPhotos
              .toSorted((a, b) => b.views - a.views)
              .find((photo) => photo.tags.includes(model.tag.replace("-", "")));

            return (
              <div key={model.tag} className="group">
                <h2
                  className={`${arefRuqaa.className} text-lg md:text-xl text-white mb-2`}
                >
                  {model.name}
                </h2>
                {matchedPhoto && (
                  <Link
                    href={`/models/${model.tag}`}
                    className="relative overflow-hidden rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105"
                  >
                    <Image
                      src={matchedPhoto.urlMedium}
                      alt={matchedPhoto.title}
                      width={300}
                      height={400}
                      className="object-cover w-full h-[400px]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
