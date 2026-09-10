import type { Config } from 'tailwindcss';

/**
 * 单位策略（多端统一，Tailwind 为主）：
 * 设计稿按 375 宽度出图，项目样式统一用 px 书写：
 * - H5：由 build/vite/plugin/postcssPxToView 中的 postcss-mobile-forever 统一把 px 转成 vw
 * - 小程序（后续）：只需把同一套 px 转成 rpx（750 设计稿即 2 倍关系）
 * 因此这里把 Tailwind 默认的 rem 刻度整体替换为 px 刻度（间距 / 字号 / 行高 / 圆角 / 最大宽度），
 * 避免 Tailwind 的 rem 逃过统一换算流程。
 */

/** 间距刻度：默认刻度的 rem 值 × 16 转成 px（4 的倍数体系） */
const SPACING = {
    px: '1px',
    0: '0px',
    0.5: '2px',
    1: '4px',
    1.5: '6px',
    2: '8px',
    2.5: '10px',
    3: '12px',
    3.5: '14px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    9: '36px',
    10: '40px',
    11: '44px',
    12: '48px',
    14: '56px',
    16: '64px',
    20: '80px',
    24: '96px',
    28: '112px',
    32: '128px',
    36: '144px',
    40: '160px',
    44: '176px',
    48: '192px',
    52: '208px',
    56: '224px',
    60: '240px',
    64: '256px',
    72: '288px',
    80: '320px',
    96: '384px',
};

type FontSizeValue = string | [string, { lineHeight: string }];

/** 字号刻度：[fontSize, lineHeight]，单位统一 px */
const FONT_SIZE: Record<string, FontSizeValue> = {
    xs: ['12px', { lineHeight: '16px' }],
    sm: ['14px', { lineHeight: '20px' }],
    base: ['16px', { lineHeight: '24px' }],
    lg: ['18px', { lineHeight: '28px' }],
    xl: ['20px', { lineHeight: '28px' }],
    '2xl': ['24px', { lineHeight: '32px' }],
    '3xl': ['30px', { lineHeight: '36px' }],
    '4xl': ['36px', { lineHeight: '40px' }],
    '5xl': ['48px', { lineHeight: '1' }],
    '6xl': ['60px', { lineHeight: '1' }],
    '7xl': ['72px', { lineHeight: '1' }],
    '8xl': ['96px', { lineHeight: '1' }],
    '9xl': ['128px', { lineHeight: '1' }],
};

/** 行高刻度：leading-3 ~ leading-10 由 rem 换成 px（其余相对值保持不变） */
const LINE_HEIGHT = {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    9: '36px',
    10: '40px',
};

/** 圆角刻度：默认 rem 值换成 px */
const BORDER_RADIUS = {
    none: '0px',
    sm: '2px',
    DEFAULT: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    '3xl': '24px',
    full: '9999px',
};

/** 最大宽度：默认 rem 值换成 px（max-w-lg = 512px 等） */
const MAX_WIDTH = {
    none: 'none',
    0: '0px',
    xs: '320px',
    sm: '384px',
    md: '448px',
    lg: '512px',
    xl: '576px',
    '2xl': '672px',
    '3xl': '768px',
    '4xl': '896px',
    '5xl': '1024px',
    '6xl': '1152px',
    '7xl': '1280px',
    full: '100%',
    min: 'min-content',
    max: 'max-content',
    fit: 'fit-content',
    prose: '65ch',
};

/**
 * Tailwind CSS 配置
 *
 * 说明：
 * 1. 深色模式跟随 html 上的 class（见 src/hooks/useThemeSync，会给 html 加上 light/dark 类）
 * 2. 项目已有 @unocss/reset 与自有全局样式（src/styles/scss/global.scss），故关闭 preflight，避免重复重置
 * 3. 语义色（border/background/foreground 等）与 src/index.css 中的 CSS 变量联动，自动适配明暗主题
 *
 * @see https://v3.tailwindcss.com/docs/configuration
 */
const config: Config = {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    corePlugins: {
        preflight: false,
    },
    theme: {
        // 以下五项以 px 刻度整体替换 Tailwind 默认的 rem 刻度，保证单位换算统一走 px
        spacing: SPACING,
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
        borderRadius: BORDER_RADIUS,
        maxWidth: MAX_WIDTH,
        extend: {
            colors: {
                // ===== shadcn 语义色（对应 src/index.css 中的 :root / .dark 变量）=====
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },

                // ===== 品牌色 =====
                primary: {
                    50: '#FFF7ED',
                    100: '#FFEDD5',
                    200: '#FED7AA',
                    300: '#FDBA74',
                    400: '#FB923C',
                    500: '#F97316',
                    600: '#EA580C',
                    700: '#C2410C',
                    800: '#9A3412',
                    900: '#7C2D12',
                },
                secondary: {
                    50: '#FFF1F2',
                    100: '#FFE4E6',
                    200: '#FECDD3',
                    300: '#FDA4AF',
                    400: '#FB7185',
                    500: '#F43F5E',
                    600: '#E11D48',
                },
                accent: {
                    50: '#F0FDFA',
                    100: '#CCFBF1',
                    200: '#99F6E4',
                    300: '#5EEAD4',
                    400: '#2DD4BF',
                    500: '#14B8A6',
                    600: '#0D9488',
                    700: '#0F766E',
                },
                surface: '#FFFFFF',
                stone: {
                    850: '#1C1917',
                },
            },
            fontFamily: {
                serif: ['Playfair Display', 'Georgia', 'serif'],
                sans: ['Source Sans 3', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
                card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
            },
        },
    },
    plugins: [],
};

export default config;
