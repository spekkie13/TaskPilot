/** @type {import('tailwindcss').Config} */
module.exports = {
    mode: 'jit',                   // Just-In-Time compiler
    content: [
        './pages/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}
