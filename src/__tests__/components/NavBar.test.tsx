import NavBar from "@/components/NavBar";
import { render, waitFor } from "@testing-library/react";

jest.mock("@/components/LocaleSwitcher", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/NavLinks", () => ({
  NavLinks: () => null,
}));

jest.mock("@/contexts/ScrollContext", () => ({
  useScroll: () => ({ lenis: null }),
}));

jest.mock("@/hooks/eventTracker", () => ({
  __esModule: true,
  default: () => jest.fn(),
}));

jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: jest.fn() }),
}));

jest.mock("next/font/google", () => ({
  Dancing_Script: () => ({ className: "font-dancing-script" }),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("NavBar", () => {
  it("updates its presentation through the native scroll fallback", async () => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 100,
    });
    jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });

    const { container } = render(<NavBar />);

    await waitFor(() =>
      expect(container.querySelector("nav")).toHaveClass("backdrop-blur-md"),
    );
  });
});
