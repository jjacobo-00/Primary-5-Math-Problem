// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Ensure all file paths are correct for your structure:
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}", // If you still have a pages directory
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // If you used a 'src' directory, you must include it:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
