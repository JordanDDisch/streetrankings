import { defineConfig, defineGlobalStyles } from "@pandacss/dev";

const globalCss = defineGlobalStyles({
  'body': {
    fontFamily: 'body'
  },
  'h1, h2, h3, h4, h5, h6': {
    fontFamily: 'heading'
  },
  'p': {
    my: 4
  }
})

export default defineConfig({
  // Whether to use css reset
  preflight: true,
  presets: ['@pandacss/preset-base', '@park-ui/panda-preset'],
  // Where to look for your css declarations
  include: ["./src/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],

  // Files to exclude
  exclude: [],
  jsxFramework: 'react',
  // The output directory for your css system
  outdir: "./src/styled-system",
  theme: {
    extend: {
      tokens: {
        fonts: {
          heading: { value: 'var(--font-oswald), sans-serif' },
          body: { value: 'var(--font-inter), sans-serif' }
        }
      }
    }
  },
  globalCss
});
