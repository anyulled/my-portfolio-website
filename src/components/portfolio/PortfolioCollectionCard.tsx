import Image from "next/image";
import Link from "next/link";
import type { PortfolioCollection } from "@/services/portfolio/types";

interface PortfolioCollectionCardProps {
  collection: PortfolioCollection;
  locale: string;
  styleLabel: string;
  viewLabel: string;
}

export default function PortfolioCollectionCard({
  collection,
  locale,
  styleLabel,
  viewLabel,
}: PortfolioCollectionCardProps) {
  const cover = collection.photos[0];
  return (
    <article className="group overflow-hidden rounded-lg border border-border/70 bg-card">
      <Link href={`/portfolio/${collection.slug}`} className="block">
        {cover && (
          <Image
            src={cover.publicUrl}
            alt={cover.altText}
            width={900}
            height={1200}
            className="h-[28rem] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            priority={false}
          />
        )}
        <div className="space-y-2 p-5">
          <p className="text-sm text-muted-foreground">
            {new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
              new Date(`${collection.sessionDate}T12:00:00`),
            )}
            {" · "}
            {collection.location}
          </p>
          <h2 className="text-xl font-semibold">{collection.name}</h2>
          <p className="text-sm text-muted-foreground">{styleLabel}</p>
          <span className="inline-block pt-2 text-sm underline underline-offset-4">
            {viewLabel}
          </span>
        </div>
      </Link>
    </article>
  );
}
