/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7A4FFF",
        secondary: "#FF8A5C",
        heading: "#2B2B2B",
        subtext: "#777777",
        accent1: "#FFD36A",
        accent2: "#FFA3A3",
        accent3: "#76D7C4",
        background: "#F9FAFF",
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
      },
      boxShadow: {
        card: "0px 4px 16px rgba(0, 0, 0, 0.05)",
        button: "0px 8px 20px rgba(122, 79, 255, 0.25)",
      },
      borderRadius: {
        card: "20px",
        button: "12px",
        input: "12px",
      },
    },
  },
  plugins: [],
};
