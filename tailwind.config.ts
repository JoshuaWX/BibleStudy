import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        chapel: {
          ink: "#151719",
          muted: "#667085",
          line: "#D7DEE8",
          paper: "#F7F8FA",
          green: "#0D6B4F",
          gold: "#B98219",
          wine: "#7A1F3D"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Arial", "sans-serif"]
      },
      boxShadow: {
        quiet: "0 20px 70px rgba(21, 23, 25, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
