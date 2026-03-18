import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './resources/views/**/*.blade.php',   // Blade templates
    './resources/js/**/*.js',             // React JS
    './resources/js/**/*.jsx',            // React JSX
    './resources/js/**/*.css',            // CSS files used by admin frontend
    './resources/js/**/*.tsx',            // React TSX
    './app/Filament/**/*.php',            // Filament classes
    './resources/filament/**/*.php',      // Filament resources
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        darkblue: '#172243',
        darkorange: '#fb9c08',
      },
    },
  },
  plugins: [forms],
  safelist: [
    { pattern: /^bg-/ },
    { pattern: /^text-/ },
    { pattern: /^w-/ },
    { pattern: /^min-h-/ },
    { pattern: /^p-/ },
    { pattern: /^rounded/ },
    { pattern: /^shadow/ },
    { pattern: /^flex$/ },
    { pattern: /^items-/ },
    { pattern: /^justify-/ },
    { pattern: /^hidden$/ },
    { pattern: /^block$/ },
    { pattern: /^space-y-/ },
  ],
}