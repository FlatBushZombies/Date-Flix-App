/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx", "./components/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // NOTE: these tokens back the "Discover" movie-night planner flow
        // (app/(tabs)/discover.tsx and its children) only — confirmed via
        // repo-wide grep before repointing. White/premium theme values.
        primary: '#FF3B5C',
        'primary-light': '#C81E4B',
        surface: '#ffffff',
        'surface-2': '#18161c',
        text: {
          primary: '#14121A',
          secondary: '#4b5563',
          muted: '#6b7280'
        }
      }
    },
  },
  plugins: [],
}