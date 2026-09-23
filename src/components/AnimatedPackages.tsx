"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  useContactDialog,
  type ContactPackage,
} from "@/components/ContactDialogContext";

interface Feature {
  icon: React.ReactNode;
  text: string;
}

interface Package {
  key: ContactPackage;
  name: string;
  price: string;
  image: string;
  features: Feature[];
}

interface AnimatedPackagesProps {
  packages: Package[];
  bookNowText: string;
}

export default function AnimatedPackages({
  packages,
  bookNowText,
}: Readonly<AnimatedPackagesProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { openContactDialog } = useContactDialog();

  useGSAP(
    () => {
      const packageElements = gsap.utils.toArray(".package-card");

      gsap.fromTo(
        packageElements,
        {
          opacity: 0,
          y: 50,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power2.out",
          delay: 0.5,
        },
      );
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className="grid lg:grid-cols-3 gap-2">
      {packages.map((pkg) => {
        const packageKey = pkg.key;

        return (
          <div
            key={packageKey}
            className="package-card dark:bg-neutral-800 bg-neutral-100 rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row"
          >
            <div className="md:w-7/12 relative">
              <Image
                src={pkg.image}
                alt={pkg.name}
                width={300}
                height={400}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h2 className="text-2xl md:text-3xl mb-2">{pkg.name}</h2>
                <p className="text-4xl md:text-5xl text-primary-foreground">
                  {pkg.price}
                </p>
              </div>
            </div>
            <div className="md:w-5/12 p-3 flex flex-col justify-between">
              <ul className="space-y-4 mb-6">
                {pkg.features.map((feature) => (
                  <li
                    key={`${packageKey}-${feature.text}`}
                    className="flex items-center ml-4"
                  >
                    <span className="mr-2 text-primary">{feature.icon}</span>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => openContactDialog(pkg.key)}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded transition duration-300"
              >
                {bookNowText}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
