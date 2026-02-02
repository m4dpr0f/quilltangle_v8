/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        qlx: '#10b981',
        qly: '#f59e0b',
        qlz: '#8b5cf6',
      }
    },
  },
  plugins: [],
}
