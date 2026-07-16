import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#171717",
        todo: {
          surface: "#09090b",
          card: "rgba(24, 24, 27, 0.8)",
          border: "#27272a",
          accent: "#FFB7C5",
          warning: "#f59e0b",
          danger: "#f43f5e",
        },
      },
      boxShadow: {
        todo: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      },
      fontFamily: {
        title: ["var(--font-geist-mono)"],
      },
      fontSize: {
        "fs-title": "3.625rem",
      },
      spacing: {
        18: "4.5rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
