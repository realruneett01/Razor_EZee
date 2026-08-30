/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#F2EBE0",
          warm: "#EDE6D8",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          warm: "#FAF7F2",
        },
        text: {
          DEFAULT: "#291C0E",
          secondary: "#7A6655",
        },
        gold: {
          DEFAULT: "#B07D3A",
          soft: "rgba(176,125,58,0.10)",
          glow: "rgba(176,125,58,0.18)",
        },
        sage: {
          DEFAULT: "#5A8A5A",
          soft: "rgba(90,138,90,0.10)",
        },
        amber: {
          DEFAULT: "#B8860B",
          soft: "rgba(184,134,11,0.10)",
        },
        rose: {
          DEFAULT: "#A04040",
          soft: "rgba(160,64,64,0.10)",
        },
        burgundy: {
          DEFAULT: "#8B3A3A",
          soft: "rgba(139,58,58,0.10)",
        },
        espresso: "#291C0E",
        brown: "#6E473B",
        taupe: "#A78D78",
        beige: "#C7B7A3",
        cream: "#E8D8C4",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
