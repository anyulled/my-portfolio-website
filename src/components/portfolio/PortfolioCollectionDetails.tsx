import Image from "next/image";
import Link from "next/link";
import type { PortfolioCollection } from "@/services/portfolio/types";

interface PortfolioCollectionDetailsProps {
  collection: PortfolioCollection;
  locale: string;
  labels: {
    date: string;
    location: string;
    style: string;
    brand: string;
    models: string;
  };
  styleLabel: string;
}

export default function PortfolioCollectionDetails({
  collection,
  locale,
  labels,
  styleLabel,
}: PortfolioCollectionDetailsProps) {
  return (
    <main className="container mx-auto space-y-10 px-4 pb-20 pt-36">
      <header className="space-y-5">
        <h1 className="text-4xl font-semibold md:text-6xl">
          {collection.name}
        </h1>
        <dl className="flex flex-wrap gap-x-8 gap-y-4 text-sm text-muted-foreground">
          <div>
            <dt className="font-medium text-foreground">{labels.date}</dt>
            <dd>
              {new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
                new Date(`${collection.sessionDate}T12:00:00`),
              )}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">{labels.location}</dt>
            <dd>{collection.location}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">{labels.style}</dt>
            <dd>{styleLabel}</dd>
          </div>
          {collection.lingerieBrand && (
            <div>
              <dt className="font-medium text-foreground">{labels.brand}</dt>
              <dd>{collection.lingerieBrand}</dd>
            </div>
          )}
          <div>
            <dt className="font-medium text-foreground">{labels.models}</dt>
            <dd className="flex flex-wrap gap-x-3">
              {collection.models.map((model) => (
                <span key={model.id} className="inline-flex gap-2">
                  <Link className="underline" href={`/models/${model.slug}`}>
                    {model.name}
                  </Link>
                  <a
                    href={model.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${model.name} external profile`}
                  >
                    ↗
                  </a>
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {collection.photos.map((photo) => (
          <Image
            key={photo.id}
            src={photo.publicUrl}
            alt={photo.altText}
            width={1200}
            height={1600}
            className="h-auto max-h-[80vh] w-full rounded-md object-cover"
          />
        ))}
      </div>
    </main>
  );
}
