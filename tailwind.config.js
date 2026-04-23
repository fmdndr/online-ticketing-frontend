/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core Surfaces (The physical stack)
        surface: {
          DEFAULT: '#f8f9fa',       // Base Layer
          container: {
            lowest: '#ffffff',      // Focus Layer
            low: '#f3f4f5',         // Intermediate Layer
            high: '#e3e4e5',        // Inputs / Hover states
            highest: '#d9dadd'      // Secondary Buttons
          }
        },
        'on-surface': '#191c1d',
        'on-surface-variant': '#6f7173', // Secondary metadata
        
        // Brand & Accents
        primary: {
          DEFAULT: '#3525cd',
          container: '#4f46e5',
          fixed: '#e2dfff'          // The Pulse skeleton loader
        },
        'on-primary': '#ffffff',
        
        secondary: {
          DEFAULT: '#10b981',       // Emerald Green (Success/Available)
        },
        
        tertiary: {
          container: '#c20038',     // Urgency Amber
          fixed: '#ffdad6',         // Text on urgency
        },
        'on-tertiary-fixed': '#ffffff',
        
        'outline-variant': '#c4c7c5', // Ghost Border fallback
      },
      fontFamily: {
        // Authoritative Velocity
        sans: ['Inter', 'sans-serif'], 
        mono: ['Space Grotesk', 'monospace'], // Timers, Seats, IDs
      },
      fontWeight: {
        retina: '450',
        extrabold: '800',
      },
      letterSpacing: {
        tightest: '-0.04em', // For Display & Headline
      },
      boxShadow: {
        // Tonal Layering Shadows
        ambient: '0 20px 40px rgba(25, 28, 29, 0.06)', // Floating elements
        primary: '0 4px 12px rgba(79, 70, 229, 0.2)',  // Primary buttons
      },
      backdropBlur: {
        glass: '24px',
      },
      scale: {
        98: '0.98',
        102: '1.02',
      }
    },
  },
  plugins: [],
}
