import Link from "next/link";
import { Aref_Ruqaa, Dancing_Script } from "next/font/google";
import { useTranslations } from "next-intl";

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });
const dancingScript = Dancing_Script({ subsets: ["latin"] });

export default function NotFound() {
  const t = useTranslations("not_found");
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 to-neutral-800 text-neutral-100 flex flex-col items-center justify-center px-4">
      <h1
        className={`${dancingScript.className} text-6xl md:text-8xl mb-4 text-peach-fuzz-500`}
      >
        {t("oops")}
      </h1>
      <h2
        className={`${arefRuqaa.className} text-3xl md:text-4xl mb-8 text-center`}
      >
        {t("not_found")}
      </h2>
      <p className="text-xl mb-8 text-center max-w-md">{t("p1")}</p>
      <Link
        href="/"
        className="bg-peach-fuzz-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded transition duration-300"
      >
        {t("return_to_homepage")}
      </Link>
    </div>
  );
}
