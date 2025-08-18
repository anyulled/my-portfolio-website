"use client";

import React, {useEffect, useRef} from "react";
import {gsap} from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import Image from "next/image";
import {Camera, Check, Eye, Heart, Users, X, Zap} from "lucide-react";
import {Photo} from "@/services/flickr/flickr.types";

gsap.registerPlugin(ScrollTrigger);

interface Myths {
    id: number;
    icon: React.FC;
    myth: string;
    truth: string;
    explanation: string;
    stats: string;
}

interface MythsWithImages extends Myths {
    image: Photo;
}

const myths: Array<Myths> = [
    {
        id: 1,
        icon: Users,
        myth: "Boudoir photography is only for young, thin women",
        truth: "Boudoir is for EVERY woman, regardless of age, size, or body type",
        explanation:
            "Beauty comes in all shapes, sizes, and ages. Professional boudoir photographers are skilled at highlighting every woman's unique beauty. Whether you're 25 or 65, size 2 or 22, you deserve to feel beautiful and empowered. The most stunning boudoir images often come from women who initially felt hesitant about their bodies.",

        stats: "Women aged 18-75+ book boudoir sessions"
    },
    {
        id: 2,
        icon: Eye,
        myth: "Boudoir photography is inappropriate or too revealing",
        truth:
            "Boudoir is tasteful, artistic, and always respects your comfort level",
        explanation:
            "Professional boudoir photography is an art form that celebrates femininity with class and elegance. You have complete control over your comfort level - from fully clothed to more intimate poses. Skilled photographers use lighting, angles, and composition to create beautiful, tasteful images that you'll be proud to display.",
        stats: "100% client control over comfort level"
    },
    {
        id: 3,
        icon: Zap,
        myth: "You need to be confident to do a boudoir shoot",
        truth: "Boudoir builds confidence - you don't need to bring it",
        explanation:
            "Most women arrive at their session feeling nervous or self-conscious. That's completely normal! The magic happens during the session as professional guidance, flattering poses, and seeing yourself through the camera's lens gradually builds your confidence. Many clients say they felt like a completely different person by the end of their shoot.",
        stats: "90% of clients start nervous, leave empowered"
    },
    {
        id: 4,
        icon: Camera,
        myth: "Boudoir photos are just for romantic partners",
        truth: "Most women do boudoir sessions for themselves",
        explanation:
            "While some women gift their images to partners, the majority book boudoir sessions as a celebration of themselves. It's about self-love, marking life milestones, celebrating personal achievements, or simply embracing your femininity. The empowerment and confidence boost are gifts you give to yourself.",
        stats: "70% of sessions are for personal empowerment"
    },
    {
        id: 5,
        icon: Heart,
        myth: "Boudoir photography is expensive and not worth it",
        truth: "It's an investment in yourself that pays dividends in confidence",
        explanation:
            "While boudoir photography is an investment, clients consistently report that the confidence boost, self-love, and empowerment they gain far exceed the cost. Many describe it as life-changing. When you consider the lasting impact on your self-image and confidence, it's one of the most valuable investments you can make in yourself.",
        stats: "Priceless confidence boost that lasts a lifetime"
    }
];

interface MythListProps {
    photos: Array<Photo>;
}

export default function MythsList({photos}: Readonly<MythListProps>) {
    const [mythsWithImages, setMythsWithImages] = React.useState<Array<MythsWithImages>>([]);
    const sectionRef = useRef<HTMLElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        const title = titleRef.current;
        const mythsWithPhotos: Array<MythsWithImages> = myths.map((myth, index) => ({
            ...myth,
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

        myths.forEach((_, index) => {

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


    }, []);

    return (
        <section ref={sectionRef} className="py-20 bg-mocha-mousse-100">
            <div className="max-w-7xl mx-auto px-4">
                <h2
                    ref={titleRef}
                    className="text-3xl md:text-5xl font-serif text-mocha-mousse-600 text-center mb-16"
                >
                    5 Myths vs Reality
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
                                        alt={`Myth ${myth.id}: ${myth.myth}`}
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
                      Myth #{myth.id}
                    </span>
                                    </div>

                                    <div
                                        className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg">
                                        <div className="flex items-start">
                                            <X
                                                className="h-6 w-6 text-red-500 mr-3 mt-1 flex-shrink-0"/>
                                            <div>
                                                <h3 className="text-lg font-semibold text-red-800 mb-2">
                                                    MYTH:
                                                </h3>
                                                <p className="text-red-700 italic">"{myth.myth}"</p>
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
                                                    TRUTH:
                                                </h3>
                                                <p className="text-green-700 font-medium">
                                                    "{myth.truth}"
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
                                                <strong>Reality
                                                    Check:</strong> {myth.stats}
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
