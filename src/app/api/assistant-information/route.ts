import { getPricing } from "@/lib/pricing";
import { publicPrice } from "@/lib/publicPrice";
import { connection, NextResponse } from "next/server";

const packageDetails = [
  { id: "express", name: "Boudoir Express" },
  { id: "experience", name: "Boudoir Experience" },
  { id: "deluxe", name: "Deluxe Experience" },
] as const;

export async function GET() {
  await connection();
  const latestPricing = await getPricing();
  const prices = {
    express: latestPricing?.express_price,
    experience: latestPricing?.experience_price,
    deluxe: latestPricing?.deluxe_price,
  };

  return NextResponse.json({
    photographer: {
      name: "Anyul Rivas",
      description:
        "Portrait, boudoir, and artistic nude photographer in Barcelona. He began photography in Caracas in 2013, has been based in Barcelona since 2016, studied at Escuela Foto Arte, and has work published in Malvie and Boudoir Inspiration.",
      aboutUrl: "https://boudoir.barcelona/about",
    },
    packages: packageDetails.map((detail) => ({
      id: detail.id,
      name: detail.name,
      price: publicPrice(prices[detail.id]),
      currency: "EUR",
      detailsUrl: "https://boudoir.barcelona/pricing",
    })),
    portfolioUrl:
      "https://boudoir.barcelona/professional-portfolio-photography",
    enquiry: {
      method: "Open the contact form on the website and submit an enquiry",
      confirmation:
        "A submitted enquiry does not confirm an appointment or availability",
    },
  });
}
