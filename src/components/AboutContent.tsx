"use client";
import FadeInTitle from "@/components/FadeInTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Photo } from "@/types/photos";
import { useTranslations } from "next-intl";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

import FadeInImage from "./FadeInImage";

/* Region Fonts */
const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const dancingScript = Dancing_Script({ subsets: ["latin"] });

/* Endregion */

interface AboutContentProps {
  images: Photo[] | null;
  profileImageUrl: string;
  collaborationImages: Photo[] | null;
}

interface ProfileSectionProps {
  profileImageUrl: string;
  t: (key: string) => string;
}

const ProfileSection = ({ profileImageUrl, t }: ProfileSectionProps) => (
  <div className="grid sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-[auto_1fr] gap-8 md:gap-6 lg:gap-8 items-start">
    <Card className="overflow-hidden md:col-span-1 lg:col-auto">
      <CardContent className="p-0">
        <FadeInImage ease={"power1.in"} duration={0.5}>
          <Image
            src={profileImageUrl}
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
      <Card className=" bg-card dark:bg-card">
        <CardContent className="p-6">
          <FadeInTitle delay={0.3}>
            <h2
              className={`${dancingScript.className} text-3xl mb-1 text-foreground dark:text-foreground`}
            >
              {t("h2")}
            </h2>
          </FadeInTitle>
          <FadeInTitle delay={0.4}>
            <h3
              className={`${arefRuqaa.className} text-lg mb-4 text-muted-foreground dark:text-muted-foreground`}
            >
              {t("h3")}
            </h3>
          </FadeInTitle>
          <p className=" my-2 text-foreground dark:text-foreground">{t("p1")}</p>
          <p className=" my-2 text-foreground dark:text-foreground">
            {t("p2")}
            <Link href={"https://efacontigo.com/"} target={"_blank"}>
              {" "}
              Escuela Foto Arte
            </Link>{" "}
            {t("p3")}
          </p>
          <p className=" my-2 text-foreground dark:text-foreground">
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
          <p className=" my-2 text-foreground dark:text-foreground">{t("p6")}</p>
          <p className=" my-2 text-foreground dark:text-foreground">{t("p7")}</p>
          <p className=" my-2 text-foreground dark:text-foreground">
            {t("p8")}
            <strong>
              Lindsay Adler, Jen Rozenbaum, Antonio Garci, Dan Hecho & Helmut
              Newton
            </strong>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
);

interface PublishedWorksProps {
  images: Photo[];
  t: (key: string) => string;
}

const PublishedWorks = ({ images, t }: PublishedWorksProps) => (
  <>
    <FadeInTitle>
      <h2
        className={`${arefRuqaa.className} text-3xl font-semibold text-center my-4 text-foreground dark:text-foreground`}
      >
        {t("published_works")}
      </h2>
    </FadeInTitle>
    <Card className={"bg-card dark:bg-card p-3"}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
        {images.map((cover: Photo, index: number) => (
          <div
            key={cover.id}
            className="relative overflow-hidden group rounded-lg"
          >
            <FadeInImage index={index} stagger={0.05}>
              <Image
                src={cover.srcSet[0]?.src}
                alt={cover.title}
                width={300}
                height={400}
                className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105 rounded-lg"
              />
              <div className="absolute inset-0 flex items-end justify-center">
                <div className="w-full bg-black bg-opacity-50 backdrop-blur-md rounded-b-lg">
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
);

interface CollaborationCardProps {
  imageSrc: string;
  alt: string;
  label: string;
  index: number;
}

const CollaborationCard = ({
  imageSrc,
  alt,
  label,
  index,
}: CollaborationCardProps) => (
  <Card className="bg-muted/50 dark:bg-muted/10 overflow-hidden border-0">
    <CardContent className="p-2">
      <FadeInImage index={index} stagger={0.1}>
        <Image
          src={imageSrc}
          alt={alt}
          width={500}
          height={300}
          className="w-full h-auto object-cover rounded-lg mb-4 hover:scale-110 grayscale transition-all duration-300 ease-in-out hover:rotate-1 hover:grayscale-0"
        />
      </FadeInImage>
      <p
        className={`${arefRuqaa.className} text-base text-center text-foreground dark:text-foreground`}
      >
        {label}
      </p>
    </CardContent>
  </Card>
);

interface CTASectionProps {
  t: (key: string) => string;
}

const CTASection = ({ t }: CTASectionProps) => (
  <Card className={"my-1 bg-card dark:bg-card overflow-hidden border-0"}>
    <CardContent className="p-6">
      <FadeInTitle duration={2.5}>
        <h2
          className={`${dancingScript.className} text-3xl mb-4 text-center text-foreground dark:text-foreground`}
        >
          {t("create_together")}
        </h2>
      </FadeInTitle>
      <p className="text-center text-foreground dark:text-foreground mb-6">
        {t("create_paragraph")}
      </p>
      <div className="text-center">
        <Link
          href="/#book-session"
          className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out hover:scale-105"
        >
          {t("book_session")}
        </Link>
      </div>
    </CardContent>
  </Card>
);

interface CollaborationsSectionProps {
  collaborationImages: Photo[] | null;
  t: (key: string) => string;
}

const getCollabItem = (
  images: Photo[] | null,
  index: number,
  fallback: string,
  alt: string,
  label: string,
) => ({
  index,
  src: images?.[index]?.srcSet[0]?.src || fallback,
  alt,
  label,
});

const CollaborationsSection = ({
  collaborationImages,
  t,
}: CollaborationsSectionProps) => {
  const collabItems = [
    getCollabItem(
      collaborationImages,
      0,
      "https://storage.googleapis.com/sensuelle-boudoir-homepage/about/peter-coulson-workshop_53985394873_o.webp",
      "Peter Coulson, Jon Hernandez, Anyul Rivas",
      "collab_peter_coulson",
    ),
    getCollabItem(
      collaborationImages,
      1,
      "https://storage.googleapis.com/sensuelle-boudoir-homepage/about/antonio-garci--chema-photo_53984294097_o.webp",
      "Antonio Garci, Chema Photo, Anyul Rivas",
      "collab_garci",
    ),
    getCollabItem(
      collaborationImages,
      2,
      "https://storage.googleapis.com/sensuelle-boudoir-homepage/about/workshop-with-rubn-surez_53985940379_o.webp",
      "Rubén Suárez, Anyul Rivas",
      "collab_ruben_suarez",
    ),
    getCollabItem(
      collaborationImages,
      3,
      "https://storage.googleapis.com/sensuelle-boudoir-homepage/about/me-and-dan-hecho_54396567099_o.webp",
      "Dan Hecho, Anyul Rivas",
      "collab_dan_hecho",
    ),
  ];

  return (
    <>
      <FadeInTitle>
        <h2
          className={`${arefRuqaa.className} text-3xl font-semibold text-center mb-8 my-4 text-foreground dark:text-foreground`}
        >
          {t("collaborations")}
        </h2>
      </FadeInTitle>

      <div className="grid md:grid-cols-3 gap-2">
        {collabItems.map((item) => (
          <CollaborationCard
            key={item.label}
            imageSrc={item.src}
            alt={item.alt}
            label={t(item.label)}
            index={item.index}
          />
        ))}
      </div>
    </>
  );
};

export default function AboutContent({
  images,
  profileImageUrl,
  collaborationImages,
}: Readonly<AboutContentProps>) {
  const t = useTranslations("about");

  return (
    <div className="min-h-screen pt-20">
      <div className="container max-w-7xl mx-auto px-4">
        <FadeInTitle>
          <h1
            className={`${arefRuqaa.className} text-4xl md:text-5xl font-bold text-center mb-8 text-foreground dark:text-foreground`}
          >
            {t("title")}
          </h1>
        </FadeInTitle>

        <ProfileSection profileImageUrl={profileImageUrl} t={t} />

        {images && <PublishedWorks images={images} t={t} />}

        <CollaborationsSection
          collaborationImages={collaborationImages}
          t={t}
        />

        <CTASection t={t} />
      </div>
    </div>
  );
}
