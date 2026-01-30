/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 12px 30px rgba(0,0,0,0.35)"
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};
