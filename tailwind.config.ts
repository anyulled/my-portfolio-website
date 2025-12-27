import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

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
        "mocha-mousse": {
          50: "#F3E9E4",
          100: "#D9C9BF",
          200: "#BB9A8B",
          300: "#AC8472",
          400: "#A47864",
          500: "#997565",
          600: "#856653",
          700: "#815C4B",
          800: "#8a6453",
          900: "#705142",
        },
        "cream-tan": {
          default: "#E5D1C1",
          50: "#FAF6F3",
          100: "#F5EDE7",
          200: "#EFDFD5",
          300: "#E5D1C1",
          400: "#D1B5A0",
          500: "#BD9A80",
          600: "#A98162",
          700: "#8B6848",
          800: "#6D4F32",
          900: "#4F371E",
        },
        "chocolate-martini": {
          default: "#5C4B51", // Base color
          50: "#F2F0F0",
          100: "#E5E1E2",
          200: "#CCC5C7",
          300: "#B2A8AC",
          400: "#998C91",
          500: "#7F6F75",
          600: "#5C4B51", // Original
          700: "#4A3B40",
          800: "#372C30",
          900: "#251D1F",
        },
        chanterelle: {
          default: "#9F8570",
          50: "#F7F4F2",
          100: "#EFE9E4",
          200: "#DFD3CA",
          300: "#CFBDB0",
          400: "#BFA696",
          500: "#9F8570",
          600: "#866D59",
          700: "#6D5645",
          800: "#544232",
          900: "#3B2D21",
        },
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
        darkBrown: "#3B2A28",
        deepBurgundy: "#6D4A47",
        warmBeige: "#E2D0BA",
        lightCream: "#F7E6D6",
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
