"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Dancing_Script, Playfair_Display } from "next/font/google";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";

const playfair = Playfair_Display({ subsets: ["latin"] });
const dancingScript = Dancing_Script({ subsets: ["latin"] });

export default function BioPage() {
  const { theme } = useTheme();

  useEffect(() => {
    document.title = "About me — Boudoir Barcelona";
  }, []);
  const magazineCovers: Array<{
    imageUrl: string;
    title: string;
    id: string;
  }> = [];
  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "bg-gradient-to-b from-gray-900 to-gray-800" : "bg-gradient-to-b from-gray-50 to-gray-100"} pt-20`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4 py-8"
      >
        <h1
          className={`${playfair.className} text-4xl md:text-5xl font-bold text-center mb-8 text-gray-800 dark:text-neutral-300`}
        >
          About me
        </h1>

        <div className="grid md:grid-cols-[auto_1fr] gap-8 items-start">
          <div>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Image
                  src="https://live.staticflickr.com/65535/53985281833_769ef447ff_z.jpg"
                  alt="Anyul Rivas — Boudoir photographer in Barcelona, Spain"
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
                  Capturing the Essence of Feminine Grace
                </h2>
                <h3 className={`${playfair.className} text-lg mb-4`}>
                  Beyond the Lens, Into the Soul
                </h3>
                <p className="text-muted-foreground mb-2">
                  Anyul Led Rivas, known on social media as{" "}
                  <strong>@anyulled</strong>, is a multifaceted photographer who
                  specializes in portrait, boudoir, and artistic nude
                  photography. Beginning his journey in 2013 in Caracas,
                  Venezuela, Anyul has since established himself in the vibrant
                  city of Barcelona, Spain, since 2016.
                </p>
                <p className="text-muted-foreground mb-2">
                  His educational journey in photography includes three years at
                  <Link href={"https://efacontigo.com/"} target={"_blank"}> Escuela Foto Arte</Link> in Caracas and workshops
                  with esteemed photographers like Roberto Mata, Eduardo
                  Álvarez, Luis Eduardo Alonso, Ruben Suarez, Chema Photo, Peter
                  Coulson, Jon Hernandez, and Antonio Garci. This diverse
                  education has honed his skills in capturing the essence of his
                  subjects.
                </p>
                <p className="text-muted-foreground mb-2">
                  His work has been widely recognized and published in various
                  international magazines, such as{" "}
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
                  , Dominante, and many others, showcasing his unique
                  perspective in photography.
                </p>
                <p className="text-muted-foreground mb-2">
                  Balancing his passion for photography with a successful career
                  as a Principal Software Engineer and conference organizer,
                  Anyul brings a unique blend of technical expertise and
                  artistic sensitivity to his work.
                </p>
                <p className="text-muted-foreground mb-2">
                  Anyul&apos;s photography is particularly noted for its focus
                  on boudoir, followed by artistic nudes and portraits. He
                  excels in revealing the hidden beauty in women, transcending
                  physical appearance to capture their emotional essence. His
                  images are marked by a sensual yet empowering approach,
                  celebrating the strength and beauty of women.
                </p>
                <p className="text-muted-foreground mb-2">
                  He draws inspiration from a myriad of photographers, including
                  <strong> Lindsay Adler, Jen Rozenbaum, Antonio Garci, and Helmut
                    Newton</strong>. His work reflects a blend of these influences,
                  combined with his personal vision, resulting in photographs
                  that are not only visually stunning but also emotionally
                  resonant.
                </p>
              </CardContent>
            </Card>

            <Card className={"dark:bg-gray-950"}>
              <CardContent className="p-6">
                <h2 className={`${dancingScript.className} text-3xl mb-4`}>
                  My Approach
                </h2>
                <p className="text-muted-foreground">
                  I believe that every person has a unique story to tell. My
                  approach to boudoir photography is to create a comfortable,
                  empowering environment where you can express your authentic
                  self...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Separator className="my-12" />

        <h2
          className={`${playfair.className} text-3xl font-semibold text-center mb-8`}
        >
          Published Work
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
          {magazineCovers.map((cover) => (
            <div key={cover.id} className="relative overflow-hidden group">
              <Image
                src={cover.imageUrl}
                alt={cover.title}
                width={300}
                height={400}
                className="w-full h-auto object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-end justify-center">
                <div className="w-full bg-black bg-opacity-50 backdrop-blur-md">
                  <p
                    className={`${dancingScript.className} text-sm sm:text-base md:text-lg text-white text-center py-2`}
                  >
                    {cover.title}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        <h2
          className={`${playfair.className} text-3xl font-semibold text-center mb-8 text-gray-800 dark:text-neutral-300`}
        >
          Collaborations
        </h2>

        <div className="grid md:grid-cols-3 gap-2">
          <Card className="dark:bg-gray-950 overflow-hidden">
            <CardContent className="p-2">
              <Image
                src="https://live.staticflickr.com/65535/53985394873_d9fca2f480_z.jpg"
                alt="Peter Coulson, Jon Hernandez, Anyul Rivas"
                width={500}
                height={300}
                className="w-full h-auto object-cover rounded-lg mb-4 hover:scale-110 transition-transform duration-300 ease-in-out hover:rotate-1"
              />
              <p className={`${playfair.className} text-base text-center`}>
                Workshop with Peter Coulson & Jon Hernández
              </p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-950 overflow-hidden">
            <CardContent className="p-2">
              <Image
                src="https://live.staticflickr.com/65535/53984294097_715ef9c26c_z.jpg"
                alt="Antonio Garci, Chema Photo, Anyul Rivas"
                width={500}
                height={300}
                className="w-full h-auto object-cover rounded-lg mb-4 hover:scale-110 transition-transform duration-300 ease-in-out hover:rotate-1"
              />
              <p className={`${playfair.className} text-base text-center`}>
                Book signature with Antonio Garci & Chema Photo at PhotoForum
                Fest
              </p>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-950 overflow-hidden">
            <CardContent className="p-2">
              <Image
                src="https://live.staticflickr.com/65535/53985940379_089fa1da0e_z.jpg"
                alt="Rubén Suárez, Anyul Rivas"
                width={500}
                height={300}
                className="w-full h-auto object-cover rounded-lg mb-4 hover:scale-110 transition-transform duration-300 ease-in-out hover:rotate-1"
              />
              <p className={`${playfair.className} text-base text-center`}>
                Fashion & portrait workshop with Rubén Suárez
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-12 dark:bg-gray-950">
          <CardContent className="p-6">
            <h2
              className={`${dancingScript.className} text-3xl mb-4 text-center`}
            >
              Let&apos;s Create Something Beautiful Together
            </h2>
            <p className="text-center text-muted-foreground">
              I&apos;m always excited to meet new clients and embark on new
              creative journeys. Whether you&apos;re looking to celebrate a
              milestone, boost your confidence, or simply create stunning art,
              I&apos;m here to guide you through an unforgettable boudoir
              experience.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
