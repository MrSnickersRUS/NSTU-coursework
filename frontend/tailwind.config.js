/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./**/*.html"],
    theme: {
        extend: {
            colors: {
                primary: '#07AB66',
                accent: '#DE093B',
                dark: '#2B2A29',
                warn: '#F2BA23',
                gray: {
                    sec: '#676767',
                    light: '#9C9C9C',
                }
            },
            boxShadow: {
                'custom': '0 4px 24px rgba(0, 0, 0, 0.1)',
            },
            fontFamily: {
                sans: ['Manrope', 'sans-serif'],
            }
        }
    },
    plugins: [],
}
