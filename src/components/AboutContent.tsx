"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import FadeInTitle from "@/components/FadeInTitle";
import FadeInImage from "@/components/FadeInImage";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import { useTranslations } from "next-intl";
import type { FlickrResponse } from "@/services/flickr/flickr.types";
import type { Photo } from "@/types/photos";

//region Fonts
const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const dancingScript = Dancing_Script({ subsets: ["latin"] });

//endregion

interface AboutContentProps {
  images: FlickrResponse | null;
  profileImageUrl: string;
  imageThumbnail: string;
}

export default function AboutContent({
                                       images,
                                       profileImageUrl,
                                       imageThumbnail
                                     }: Readonly<AboutContentProps>) {
  const t = useTranslations("about");
  return (
    <div className="min-h-screen pt-20">
      <div className="container max-w-7xl mx-auto px-4">
        <FadeInTitle>
          <h1
            className={`${arefRuqaa.className} text-4xl md:text-5xl font-bold text-center mb-8`}
          >
            {t("title")}
          </h1>
        </FadeInTitle>

        <div
          className="grid sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-[auto_1fr] gap-8 md:gap-6 lg:gap-8 items-start">
          <Card className="overflow-hidden md:col-span-1 lg:col-auto">
            <CardContent className="p-0">
              <FadeInImage ease={"power1.in"} duration={0.5}>
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
              </FadeInImage>
            </CardContent>
          </Card>

          <div className="space-y-6 md:col-span-2 lg:col-auto">
            <Card className=" bg-mocha-mousse-50 dark:bg-mocha-mousse-50">
              <CardContent className="p-6">
                <FadeInTitle delay={0.3}>
                  <h2 className={`${dancingScript.className} text-3xl mb-1`}>
                    {t("h2")}
                  </h2>
                </FadeInTitle>
                <FadeInTitle delay={0.4}>
                  <h3 className={`${arefRuqaa.className} text-lg mb-4`}>
                    {t("h3")}
                  </h3>
                </FadeInTitle>
                <p className=" my-2">{t("p1")}</p>
                <p className=" my-2">
                  {t("p2")}
                  <Link href={"https://efacontigo.com/"} target={"_blank"}>
                    {" "}
                    Escuela Foto Arte
                  </Link>{" "}
                  {t("p3")}
                </p>
                <p className=" my-2">
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
                <p className=" my-2">{t("p6")}</p>
                <p className=" my-2">{t("p7")}</p>
                <p className=" my-2">
                  {t("p8")}
                  <strong>
                    Lindsay Adler, Jen Rozenbaum, Antonio Garci, Dan Hecho &
                    Helmut Newton
                  </strong>
                  .
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {images?.photos && (
          <>
            <FadeInTitle>
              <h2
                className={`${arefRuqaa.className} text-3xl font-semibold text-center my-4`}
              >
                {t("published_works")}
              </h2>
            </FadeInTitle>
            <Card className={"bg-mocha-mousse-50 dark:bg-mocha-mousse-50 p-3"}>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
                {images.photos.map((cover: Photo, index: number) => (
                  <div
                    key={cover.id}
                    className="relative overflow-hidden group rounded-lg"
                  >
                    <FadeInImage index={index} stagger={0.05}>
                      <Image
                        src={cover.urlMedium}
                        blurDataURL={cover.urlSmall}
                        placeholder="blur"
                        alt={cover.title}
                        width={300}
                        height={400}
                        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105 rounded-lg"
                      />
                      <div
                        className="absolute inset-0 flex items-end justify-center">
                        <div
                          className="w-full bg-black bg-opacity-50 backdrop-blur-md rounded-b-lg">
                          <p
                            className={`${arefRuqaa.className} text-xs sm:text-xs md:text-sm text-white text-center py-2`}
                          >
                            {cover.title}
                          </p>
                        </div>
                      </div>
                    </FadeInImage>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
        <FadeInTitle>
          <h2
            className={`${arefRuqaa.className} text-3xl font-semibold text-center mb-8 my-4`}
          >
            {t("collaborations")}
          </h2>
        </FadeInTitle>

        <div className="grid md:grid-cols-3 gap-2">
          <Card
            className="bg-mocha-mousse-100 dark:bg-mocha-mousse-900 overflow-hidden border-0">
            <CardContent className="p-2">
              <FadeInImage index={0} stagger={0.1}>
                <Image
                  src="https://live.staticflickr.com/65535/53985394873_d9fca2f480_z.jpg"
                  blurDataURL="https://live.staticflickr.com/65535/53985394873_d9fca2f480_w_d.jpg"
                  placeholder="blur"
                  alt="Peter Coulson, Jon Hernandez, Anyul Rivas"
                  width={500}
                  height={300}
                  className="w-full h-auto object-cover rounded-lg mb-4 hover:scale-110 grayscale transition-all duration-300 ease-in-out hover:rotate-1 hover:grayscale-0"
                />
              </FadeInImage>
              <p className={`${arefRuqaa.className} text-base text-center`}>
                {t("collab_peter_coulson")}
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-mocha-mousse-100 dark:bg-mocha-mousse-900 overflow-hidden border-0">
            <CardContent className="p-2">
              <FadeInImage index={1} stagger={0.1}>
                <Image
                  src="https://live.staticflickr.com/65535/53984294097_715ef9c26c_z.jpg"
                  blurDataURL="https://live.staticflickr.com/65535/53984294097_715ef9c26c_w_d.jpg"
                  placeholder="blur"
                  alt="Antonio Garci, Chema Photo, Anyul Rivas"
                  width={500}
                  height={300}
                  className="w-full h-auto object-cover rounded-lg mb-4 hover:scale-110 grayscale transition-all duration-300 ease-in-out hover:rotate-1 hover:grayscale-0"
                />
              </FadeInImage>
              <p className={`${arefRuqaa.className} text-base text-center`}>
                {t("collab_garci")}
              </p>
            </CardContent>
          </Card>

          <Card
            className="bg-mocha-mousse-100 dark:bg-mocha-mousse-900 overflow-hidden border-0">
            <CardContent className="p-2">
              <FadeInImage index={2} stagger={0.1}>
                <Image
                  src="https://live.staticflickr.com/65535/53985940379_089fa1da0e_z.jpg"
                  blurDataURL="https://live.staticflickr.com/65535/53985940379_089fa1da0e_w_d.jpg"
                  placeholder="blur"
                  alt="Rubén Suárez, Anyul Rivas"
                  width={500}
                  height={300}
                  className="w-full h-auto object-cover rounded-lg mb-4 hover:scale-110 grayscale transition-all duration-300 ease-in-out hover:rotate-1 hover:grayscale-0"
                />
              </FadeInImage>
              <p className={`${arefRuqaa.className} text-base text-center`}>
                {t("collab_ruben_suarez")}
              </p>
            </CardContent>
          </Card>

          <Card
            className="my-1 bg-mocha-mousse-100 dark:bg-mocha-mousse-900 overflow-hidden border-0">
            <CardContent className="p-2">
              <FadeInImage index={3} stagger={0.1}>
                <Image
                  src="https://live.staticflickr.com/65535/54396567099_28021d76b8_z.jpg"
                  blurDataURL="https://live.staticflickr.com/65535/54396567099_28021d76b8_w_d.jpg"
                  placeholder="blur"
                  alt="Dan Hecho, Anyul Rivas"
                  width={500}
                  height={300}
                  className="w-full h-auto object-cover rounded-lg mb-4 hover:scale-110 grayscale transition-all duration-300 ease-in-out hover:rotate-1 hover:grayscale-0"
                />
              </FadeInImage>
              <p className={`${arefRuqaa.className} text-base text-center`}>
                {t("collab_dan_hecho")}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card
          className={
            "my-1 bg-mocha-mousse-50 dark:bg-mocha-mousse-900 overflow-hidden border-0"
          }
        >
          <CardContent className="p-6">
            <FadeInTitle duration={2.5}>
              <h2
                className={`${dancingScript.className} text-3xl mb-4 text-center`}
              >
                {t("create_together")}
              </h2>
            </FadeInTitle>
            <p className="text-center ">{t("create_paragraph")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
