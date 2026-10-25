"use client";

import PortfolioRouteError from "@/components/portfolio/PortfolioRouteError";

interface PortfolioErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function ModelsError({ retry }: PortfolioErrorProps) {
  return <PortfolioRouteError retry={retry} />;
}
