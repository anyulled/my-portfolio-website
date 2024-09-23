import Image from "next/image";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import { getFlickrPhotos, Photo } from "@/services/flickr";
import { Card, CardContent } from "@/components/ui/card";
import Gallery from "@/components/Gallery";
/*eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const dancingScript = Dancing_Script({ subsets: ["latin"] });

function getRandomElements(arr: Photo[], num: number) {
  const shuffled = arr.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

export default async function BoudoirStylePage() {
  const { photos } = await getFlickrPhotos("boudoir, model", "50");
  const randomPhotos = getRandomElements(photos!, 10);

  return (
    <>
      <header className="container mx-auto px-4 pt-24 pb-4 text-center">
        <h1 className={`${dancingScript.className} text-5xl md:text-7xl mb-4`}>
          Boudoir Photography
        </h1>
        <p
          className={`${arefRuqaa.className} text-xl md:text-2xl text-neutral-300 prose`}
        >
          Empowering, Intimate, and Artistic
        </p>
      </header>
      <main className="container mx-auto px-4 py-4">
        <section className="mb-16">
          <h2 className={`${arefRuqaa.className} text-3xl md:text-4xl mb-6`}>
            What is Boudoir Photography?
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/3">
              <p className="mb-4 prose lg:prose-xl">
                Boudoir photography is an intimate and artistic style of
                portraiture. It captures subjects, typically women, in a
                sensual, romantic, and sometimes erotic manner. The term
                &quot;boudoir&quot; comes from the French word for a
                woman&apos;s private dressing room or bedroom.
              </p>
              <p className={"prose lg:prose-xl"}>
                This style of photography aims to celebrate the subject&apos;s
                body, boost confidence, and create stunning, personal artwork.
                Boudoir shoots can range from tastefully suggestive to more
                revealing, always prioritizing the comfort and vision of the
                subject.
              </p>
            </div>
            <div className="md:w-2/3">
              <Image
                src={randomPhotos?.at(1)?.urlZoom!}
                alt="Boudoir Photography"
                width={600}
                height={400}
                className="rounded-lg shadow-lg h-auto w-full"
              />
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className={`${arefRuqaa.className} text-3xl md:text-4xl mb-6`}>
            The Art of Boudoir
          </h2>
          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="md:w-2/3">
              <p className="mb-4 prose lg:prose-xl">
                Boudoir photography is more than just taking pictures; it&apos;s
                an art form that requires skill, sensitivity, and creativity.
                Photographers must create a safe, comfortable environment where
                subjects can express themselves freely.
              </p>
              <p className={"prose lg:prose-xl"}>
                Lighting, composition, and posing are crucial elements in
                boudoir photography. Soft, flattering light is often used to
                create a romantic atmosphere, while thoughtful composition
                ensures elegant and tasteful results.
              </p>
            </div>
            <div className="md:w-1/3">
              <Image
                src={randomPhotos?.at(2)?.urlZoom!}
                alt="Boudoir Photography"
                width={600}
                height={400}
                className="rounded-lg shadow-lg h-auto w-full"
              />
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className={`${arefRuqaa.className} text-3xl md:text-4xl mb-6`}>
            Why Choose Boudoir Photography?
          </h2>
          <ul className="list-disc list-inside space-y-4 mb-8 ml-4">
            <li>Boost self-confidence and body positivity</li>
            <li>Celebrate a milestone or life change</li>
            <li>Create a unique, personal gift for a partner</li>
            <li>Embrace and express your sensuality</li>
            <li>Capture your beauty at any age or stage of life</li>
          </ul>
          <Card>
            <CardContent>
              <Gallery photos={randomPhotos} showTitle={false} />
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className={`${arefRuqaa.className} text-3xl md:text-4xl mb-6`}>
            Your Boudoir Experience
          </h2>
          <p className="mb-4 prose lg:prose-xl">
            At Sensuelle Boudoir, we&apos;re dedicated to providing a luxurious,
            comfortable, and empowering boudoir experience. Our professional
            team will guide you through every step, from planning your shoot to
            selecting your favorite images.
          </p>
          <p className="mb-8 prose lg:prose-xl">
            Whether you&apos;re looking to boost your confidence, celebrate your
            body, or create a special gift, our boudoir photography sessions are
            tailored to your unique vision and comfort level.
          </p>
          <div className="text-center">
            <a
              href="/#book-session"
              className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition duration-300"
            >
              Book Your Boudoir Session
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
