import { getMadridDate } from "./types";
import { PhotographyReleaseForm } from "./components/PhotographyReleaseForm";
import { Metadata } from "next";
import { useTranslations } from "next-intl";

export const metadata: Metadata = {
  title: "Photography Release",
  description: "Complete and sign the photography release form.",
};

export default function PhotographyReleasePage() {
  const t = useTranslations("release_form");
  const sessionDate = getMadridDate();

  return (
    <main className="px-6 py-24 sm:py-32">
      <div className="mx-auto mb-8 max-w-3xl text-center">
        <h1>{t("title")}</h1>
        <p className="mt-4 text-lg">{t("intro")}</p>
      </div>
      <PhotographyReleaseForm sessionDate={sessionDate} />
    </main>
  );
}
