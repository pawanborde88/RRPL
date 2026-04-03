/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    theme: {
        extend: {
            boxShadow: {
                enterprise:
                    '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.07)',
                'enterprise-md':
                    '0 4px 6px -1px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.05)',
                'enterprise-lg':
                    '0 12px 40px -12px rgb(15 23 42 / 0.12), 0 4px 14px -4px rgb(15 23 42 / 0.06)',
            },
        },
    },
    plugins: [],
}
