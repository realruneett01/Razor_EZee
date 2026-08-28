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
        background: "#080C14",
        card: "#0F172A",
        "card-border": "#1E293B",
        accent: {
          blue: "#38BDF8",
          emerald: "#10B981",
          amber: "#F59E0B",
          rose: "#F43F5E",
          indigo: "#6366F1",
        }
      },
    },
  },
  plugins: [],
};
