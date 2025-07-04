import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // Adjust based on your project structure
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1D4ED8", // custom blue
        secondary: "#F59E0B", // custom amber
        muted: "#6B7280", // gray-500
        selected: "#3B82F6", // blue-500
        available: "#D1D5DB", // gray-300
        occupied: "#10B981", // green-500
        blocked: "#EF4444", // red-500
        timeSlot: "#494949"
      },
      fontFamily: {
        sans: ["Sora", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
