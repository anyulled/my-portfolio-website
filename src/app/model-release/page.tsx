import { getMadridDate } from "./types";
import { ModelReleaseForm } from "./components/ModelReleaseForm";
import { Metadata } from "next";
import { useTranslations } from "next-intl";

export const metadata: Metadata = {
  title: "Model Release",
  description: "Complete and sign the model release form.",
};

export default function ModelReleasePage() {
  const t = useTranslations("model_release");
  const releaseDate = getMadridDate();

  return (
    <main className="px-6 py-24 sm:py-32">
      <div className="mx-auto mb-8 max-w-3xl text-center">
        <h1>{t("title")}</h1>
        <p className="mt-4 text-lg">{t("intro")}</p>
      </div>
      <ModelReleaseForm releaseDate={releaseDate} />
    </main>
  );
}
