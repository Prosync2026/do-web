/** @type {import('tailwindcss').Config} */
import PrimeUI from 'tailwindcss-primeui';

export default {
    darkMode: ['selector', '[class*="app-dark"]'],
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}', './node_modules/@prosync_solutions/ui/**/*.{js,ts,vue,css}'],
    plugins: [PrimeUI],
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: '#03439a',
                    'primary-strong': '#02367b',
                    secondary: '#f0c10f'
                },
                surface: {
                    'sub-bg': '#ffffff',
                    'gray-bg': '#f3f4f6',
                    'gray-bg-strong': '#e5e7eb'
                },
                text: {
                    'on-primary': '#ffffff',
                    body: '#1d293d',
                    heading: '#020618'
                },
                border: {
                    border: '#e5e7eb'
                }
            },
            borderRadius: {
                button: '6px',
                card: '12px',
                container: '12px',
                table: '12px',
                tag: '6px'
            }
        },
        screens: {
            sm: '576px',
            md: '768px',
            lg: '992px',
            xl: '1200px',
            '2xl': '1920px'
        }
    }
};
