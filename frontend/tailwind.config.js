/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: "#7c3aed",
          pastel: {
            mint: "#d1fae5",
            lavender: "#ede9fe",
            blush: "#fce7f3",
            peach: "#ffedd5",
            sky: "#e0f2fe",
            lemon: "#fef9c3",
          },
        },
        spacing: {
          72: "18rem",
        },
      },
    },
    plugins: [],
  };
  