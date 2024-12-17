import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const generateColorPalette = (baseColor: string, name: string) => {
  return {
    [name]: {
      50: `hsl(var(--${baseColor}-50))`,
      100: `hsl(var(--${baseColor}-100))`,
      200: `hsl(var(--${baseColor}-200))`,
      300: `hsl(var(--${baseColor}-300))`,
      400: `hsl(var(--${baseColor}-400))`,
      500: `hsl(var(--${baseColor}-500))`,
      600: `hsl(var(--${baseColor}-600))`,
      700: `hsl(var(--${baseColor}-700))`,
      800: `hsl(var(--${baseColor}-800))`,
      900: `hsl(var(--${baseColor}-900))`,
      950: `hsl(var(--${baseColor}-950))`,
    },
  };
};

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "peach-fuzz": {
          50: "#fff7f2",
          100: "#ffede3",
          200: "#ffdfcc",
          300: "#ffcfb3",
          400: "#ffc6a6",
          500: "#FFBE98",
          600: "#f2b18b",
          700: "#e6a47e",
          800: "#cc8b65",
          900: "#b2724c",
        },
        ...generateColorPalette("#B2AC88", "sage"),
        ...generateColorPalette("#7C9EB2", "sky"),
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        telegram: "#24A1DE",
        whatsapp: "#25D366",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      textShadow: {
        xs: "0 1px 1px var(--tw-shadow-color)",
        sm: "0 1px 2px var(--tw-shadow-color)",
        default: "0 2px 4px var(--tw-shadow-color)",
        lg: "0 8px 16px var(--tw-shadow-color)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("tailwindcss-typography"),
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          "text-shadow": (value) => ({
            textShadow: value,
          }),
        },
        { values: theme("textShadow") },
      );
    }),
  ],
};
export default config;
