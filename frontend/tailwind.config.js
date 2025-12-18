/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./**/*.html"],
    safelist: [
        'rounded-[20px]',
        'rounded-[30px]',
        'rounded-t-[30px]',
        'bg-[#FAFAFA]',
        'border-[#FAFAFA]',
        'text-[10px]',
        'bg-green-50',
        'bg-red-50',
        'bg-yellow-50',
        'text-green-600',
        'text-red-600',
        'text-yellow-600',
        'shadow-sheet',
        'shadow-card',
        'shadow-custom',
        'bg-gray-bg',
        'text-gray-sec',
        'text-status-success',
        'text-status-busy',
        'text-status-wait',
    ],
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
                    bg: '#F5F5F5',
                },
                status: {
                    success: '#07AB66',
                    busy: '#DE093B',
                    wait: '#F2BA23',
                }
            },
            boxShadow: {
                'custom': '0 4px 24px rgba(0, 0, 0, 0.1)',
                'card': '0 2px 12px rgba(0, 0, 0, 0.04)',
                'sheet': '0 -4px 24px rgba(0, 0, 0, 0.1)',
            },
            fontFamily: {
                sans: ['Manrope', 'sans-serif'],
            }
        }
    },
    plugins: [],
}

