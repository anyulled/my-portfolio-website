"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { Camera, Check, Eye, Heart, Users, X, Zap } from "lucide-react";
import { Photo } from "@/services/flickr/flickr.types";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

type MythId = "1" | "2" | "3" | "4" | "5";

interface MythsBase {
  id: MythId;
    icon: React.FC;
}

interface MythTexts {
    myth: string;
    truth: string;
    explanation: string;
    stats: string;
}

interface MythsWithImages extends MythsBase, MythTexts {
    image: Photo;
}

const mythBases = [
  { id: "1", icon: Users },
  { id: "2", icon: Eye },
  { id: "3", icon: Zap },
  { id: "4", icon: Camera },
  { id: "5", icon: Heart }
] as const satisfies ReadonlyArray<MythsBase>;

interface MythListProps {
    photos: Array<Photo>;
}

export default function MythsList({photos}: Readonly<MythListProps>) {
    const [mythsWithImages, setMythsWithImages] = React.useState<Array<MythsWithImages>>([]);
    const sectionRef = useRef<HTMLElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
  const t = useTranslations("myths.list");

    useEffect(() => {
        const section = sectionRef.current;
        const title = titleRef.current;
      const itemKey = <K extends "myth" | "truth" | "explanation" | "stats">(id: MythId, key: K) => `items.${id}.${key}` as const;
      const mythsTexts: MythTexts[] = mythBases.map((base) => ({
        myth: t(itemKey(base.id, "myth")),
        truth: t(itemKey(base.id, "truth")),
        explanation: t(itemKey(base.id, "explanation")),
        stats: t(itemKey(base.id, "stats"))
      }));

      const mythsWithPhotos: Array<MythsWithImages> = mythBases.map((base, index) => ({
        ...base,
        ...mythsTexts[index],
            image: photos.at(index)!
        }));

        setMythsWithImages(mythsWithPhotos);

        if (!section || !title) return;

        gsap.set(title, {
            opacity: 0,
            y: 50
        });

        gsap.to(title, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
                trigger: title,
                start: "top 80%",
                toggleActions: "play none none reverse"
            }
        });

      mythBases.forEach((_, index) => {
        const mythCard = section.querySelector(`#myth-${index + 1}`);
        if (!mythCard) return;

            gsap.set(mythCard, {
                opacity: 0,
                y: 100
            });

        gsap.to(mythCard, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: mythCard,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        });
      });
    }, [photos, t]);

    return (
        <section ref={sectionRef} className="py-20 bg-mocha-mousse-100">
            <div className="max-w-7xl mx-auto px-4">
                <h2
                    ref={titleRef}
                    className="text-3xl md:text-5xl font-serif text-mocha-mousse-600 text-center mb-16"
                >
                  {t("title")}
                </h2>

                <div className="space-y-16">
                    {mythsWithImages.map((myth, index) => {
                        const IconComponent = myth.icon;
                        const isEven = index % 2 === 0;

                        return (
                            <div
                                key={myth.id}
                                id={`myth-${myth.id}`}
                                className={`grid lg:grid-cols-2 gap-12 items-center ${isEven ? "" : "lg:grid-flow-col-dense"}`}
                            >
                                <div
                                    className={isEven ? "lg:order-1" : "lg:order-2"}>
                                    <Image
                                        src={myth.image.urlMedium}
                                        alt={t("image_alt", { id: Number(myth.id), myth: myth.myth })}
                                        width={600}
                                        height={400}
                                        className="rounded-2xl shadow-xl object-cover w-full"
                                    />
                                </div>

                                <div
                                    className={`space-y-6 ${isEven ? "lg:order-2" : "lg:order-1"}`}
                                >
                                    <div
                                        className="flex items-center space-x-4 mb-6">
                                        <div
                                            className="w-12 h-12 bg-mocha-mousse-600 rounded-full flex items-center justify-center">
                                            <IconComponent
                                                className="h-6 w-6 text-white"/>
                                        </div>
                                        <span
                                            className="text-2xl font-bold text-mocha-mousse-900">
                      {t("myth_number", { id: Number(myth.id) })}
                    </span>
                                    </div>

                                    <div
                                        className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg">
                                        <div className="flex items-start">
                                            <X
                                                className="h-6 w-6 text-red-500 mr-3 mt-1 flex-shrink-0"/>
                                            <div>
                                                <h3 className="text-lg font-semibold text-red-800 mb-2">
                                                  {t("labels.myth")}
                                                </h3>
                                              <p className="text-red-700 italic">&quot;{myth.myth}&quot;</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className="bg-green-50 border-l-4 border-green-400 p-6 rounded-r-lg">
                                        <div className="flex items-start">
                                            <Check
                                                className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0"/>
                                            <div>
                                                <h3
                                                    className="text-lg font-semibold text-green-800 mb-2">
                                                  {t("labels.truth")}
                                                </h3>
                                                <p className="text-green-700 font-medium">
                                                  &quot;{myth.truth}&quot;
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className="bg-white p-6 rounded-lg shadow-md">
                                        <p className="text-mocha-mousse-700 leading-relaxed mb-4">
                                            {myth.explanation}
                                        </p>
                                        <div
                                            className="bg-mocha-mousse-200 p-3 rounded-lg">
                                            <p className="text-sm font-medium text-mocha-mousse-100">
                                              <strong>{t("labels.reality_check")}</strong> {myth.stats}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
