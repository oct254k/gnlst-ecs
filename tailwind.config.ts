import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  corePlugins: {
    preflight: false, // 디자인 시스템 CSS와 충돌 방지
  },
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
