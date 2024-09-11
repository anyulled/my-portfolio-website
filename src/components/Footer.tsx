import { Aref_Ruqaa } from "next/font/google";

const arefRuqaa = Aref_Ruqaa({ subsets: ["latin"], weight: "400" });

export default function Footer() {
  return (
    <footer className="py-4 text-center dark:bg-zinc-900 dark:text-gray-100 text-gray-800 bg-white">
      <div className={`container mx-auto px-6 ${arefRuqaa.className}`}>
        <p>&copy; 2024 Sensuelle Boudoir. All rights reserved.</p>
      </div>
    </footer>
  );
}
