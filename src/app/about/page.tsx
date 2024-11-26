import Image from "next/image";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { getFlickrPhotos } from "@/services/flickr";
import { Metadata } from "next";
import { openGraph } from "@/lib/openGraph";
import { getTranslations } from "next-intl/server";
import { createFlickr } from "flickr-sdk";

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const dancingScript = Dancing_Script({ subsets: ["latin"] });

const profileImageUrl =
  "https://live.staticflickr.com/65535/53985281833_769ef447ff_z.jpg";

const imageThumbnail =
  "https://live.staticflickr.com/65535/53985281833_769ef447ff_c_d.jpg";
const metadataImages = [
  {
    alt: "Anyul Rivas",
    url: profileImageUrl,
  },
];
export const metadata: Metadata = {
  title: "About Me",
  description: "Anyul Rivas — Boudoir photographer in Barcelona, Spain",
  twitter: {
    images: metadataImages,
  },
  openGraph: {
    ...openGraph,
    images: metadataImages,
  },
};

export default async function BioPage() {
  const { flickr } = createFlickr(process.env.FLICKR_API_KEY!);
  const images = await getFlickrPhotos(flickr, "cover", 50);
  const t = await getTranslations("about");

  return (
    <div className={`min-h-screen pt-20`}>
      <div className="container max-w-7xl mx-auto px-4">
        <h1
          className={`${arefRuqaa.className} text-4xl md:text-5xl font-bold text-center mb-8`}
        >
          {t("title")}
        </h1>

        <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
          <div>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Image
                  src={profileImageUrl}
                  blurDataURL={imageThumbnail}
                  placeholder="blur"
                  priority
                  alt={t("alt_image")}
                  width={400}
                  height={600}
                  className="w-full h-auto object-cover hover:scale-110 transition-transform duration-300 ease-in-out hover:rotate-1"
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className={"dark:bg-gray-950"}>
              <CardContent className="p-6">
                <h2 className={`${dancingScript.className} text-3xl mb-1`}>
                  {t("h2")}
                </h2>
                <h3 className={`${arefRuqaa.className} text-lg mb-4`}>
                  {t("h3")}
                </h3>
                <p className="text-muted-foreground my-2">{t("p1")}</p>
                <p className="text-muted-foreground my-2">
                  {t("p2")}
                  <Link href={"https://efacontigo.com/"} target={"_blank"}>
                    {" "}
                    Escuela Foto Arte
                  </Link>{" "}
                  {t("p3")}
                </p>
                <p className="text-muted-foreground my-2">
                  {t("p4")}
                  <Link href={"https://www.malvie.fr/"} target={"_blank"}>
                    Malvie
                  </Link>
                  ,{" "}
                  <Link
                    href={"https://www.boudoirinspiration.com/anyulled"}
                    target={"_blank"}
                  >
                    Boudoir Inspiration
                  </Link>
                  , Dominante, {t("p5")}
                </p>
                <p className="text-muted-foreground my-2">{t("p6")}</p>
                <p className="text-muted-foreground my-2">{t("p7")}</p>
                <p className="text-muted-foreground my-2">
                  {t("p8")}
                  <strong>
                    Lindsay Adler, Jen Rozenbaum, Antonio Garci, & Helmut Newton
                  </strong>
                  .
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {images?.photos && (
          <>
            <h2
              className={`${arefRuqaa.className} text-3xl font-semibold text-center my-4`}
            >
              {t("published_works")}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
              {images.photos.map((cover) => (
                <div key={cover.id} className="relative overflow-hidden group">
                  <Image
                    src={cover.urlMedium}
                    blurDataURL={cover.urlSmall}
                    placeholder="blur"
                    alt={cover.title}
                    width={300}
                    height={400}
                    className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-end justify-center">
                    <div className="w-full bg-black bg-opacity-50 backdrop-blur-md">
                      <p
                        className={`${arefRuqaa.className} text-xs sm:text-xs md:text-sm text-white text-center py-2`}
                      >
                        {cover.title}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <h2
          className={`${arefRuqaa.className} text-3xl font-semibold text-center mb-8  my-4`}
        >
          {t("collaborations")}
        </h2>

        <div className="grid md:grid-cols-3 gap-2">
          <Card className="dark:bg-gray-950 overflow-hidden">
            <CardContent className="p-2">
              <Image
                src="https://live.staticflickr.com/65535/53985394873_d9fca2f480_z.jpg"
                blurDataURL="https://live.staticflickr.com/65535/53985394873_d9fca2f480_w_d.jpg"
                placeholder="blur"
                alt="Peter Coulson, Jon Hernandez, Anyul Rivas"
                width={500}
                height={300}
                className="w-full h-auto object-cover rounded-lg mb-4 hover:scale-110 grayscale transition-transform duration-300 ease-in-out hover:rotate-1"
              />
              <p className={`${arefRuqaa.className} text-base text-center`}>
                {t("collab_peter_coulson")}
              </p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-950 overflow-hidden">
            <CardContent className="p-2">
              <Image
                src="https://live.staticflickr.com/65535/53984294097_715ef9c26c_z.jpg"
                blurDataURL="https://live.staticflickr.com/65535/53984294097_715ef9c26c_w_d.jpg"
                placeholder="blur"
                alt="Antonio Garci, Chema Photo, Anyul Rivas"
                width={500}
                height={300}
                className="w-full h-auto object-cover rounded-lg mb-4 hover:scale-110 grayscale transition-transform duration-300 ease-in-out hover:rotate-1"
              />
              <p className={`${arefRuqaa.className} text-base text-center`}>
                {t("collab_garci")}
              </p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-950 overflow-hidden">
            <CardContent className="p-2">
              <Image
                src="https://live.staticflickr.com/65535/53985940379_089fa1da0e_z.jpg"
                blurDataURL="https://live.staticflickr.com/65535/53985940379_089fa1da0e_w_d.jpg"
                placeholder="blur"
                alt="Rubén Suárez, Anyul Rivas"
                width={500}
                height={300}
                className="w-full h-auto object-cover rounded-lg mb-4 hover:scale-110 grayscale transition-transform duration-300 ease-in-out hover:rotate-1"
              />
              <p className={`${arefRuqaa.className} text-base text-center`}>
                {t("collab_ruben_suarez")}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="my-12 dark:bg-gray-950">
          <CardContent className="p-6">
            <h2
              className={`${dancingScript.className} text-3xl mb-4 text-center`}
            >
              {t("create_together")}
            </h2>
            <p className="text-center text-muted-foreground">
              {t("create_paragraph")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
