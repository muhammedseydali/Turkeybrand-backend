/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17181C",
        paper: "#F2F1EC",
        panel: "#FFFFFF",
        brick: "#E4572E",
        "brick-dark": "#C2431F",
        mustard: "#C9A15A",
        line: "#DEDBD3",
        muted: "#75746E",
      },
      fontFamily: {
        display: ["'Big Shoulders Display'", "sans-serif"],
        body: ["'Work Sans'", "sans-serif"],
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "2px",
      },
    },
  },
  plugins: [],
}
